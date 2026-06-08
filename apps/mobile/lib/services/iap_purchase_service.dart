import 'dart:async';
import 'dart:io' show Platform;

import 'package:flutter/foundation.dart';
import 'package:in_app_purchase/in_app_purchase.dart';

import 'huhu_api.dart';

/// Store IAP for `com.ctrlz.huhu` subscriptions; falls back to dev stub when
/// the store is unavailable (emulator, missing Play/App Store setup).
class IapPurchaseService {
  IapPurchaseService(this._api);

  final HuhuApi _api;
  final InAppPurchase _iap = InAppPurchase.instance;
  StreamSubscription<List<PurchaseDetails>>? _updatesSub;
  final Map<String, Completer<Map<String, dynamic>>> _pending = {};
  _RestoreBatch? _restoreBatch;

  static const Map<String, String> defaultSubscriptionProductIds = {
    'lite': 'com.ctrlz.huhu.sub.lite',
    'basic': 'com.ctrlz.huhu.sub.basic',
    'premium': 'com.ctrlz.huhu.sub.premium',
  };

  static const Map<String, String> defaultCoinProductIds = {
    'small': 'com.ctrlz.huhu.coins.small',
    'medium': 'com.ctrlz.huhu.coins.medium',
    'large': 'com.ctrlz.huhu.coins.large',
  };

  Map<String, String> subscriptionProductIds =
      Map<String, String>.from(defaultSubscriptionProductIds);
  Map<String, String> coinProductIds =
      Map<String, String>.from(defaultCoinProductIds);

  /// Pull SKU ids from `GET /v1/meta/iap-products`; keeps defaults on failure.
  Future<void> syncProductCatalog() async {
    try {
      final meta = await _api.getIapProducts(platform: platform);
      final subs =
          (meta['subscriptions'] as List<dynamic>?)?.cast<Map<String, dynamic>>() ??
              [];
      for (final row in subs) {
        final tier = row['tier'] as String?;
        final productId = row['productId'] as String?;
        if (tier != null && productId != null && productId.isNotEmpty) {
          subscriptionProductIds[tier] = productId;
        }
      }
      final products =
          (meta['products'] as List<dynamic>?)?.cast<Map<String, dynamic>>() ??
              [];
      for (final row in products) {
        if (row['kind'] != 'coins') continue;
        final productId = row['productId'] as String?;
        if (productId == null || productId.isEmpty) continue;
        for (final pack in defaultCoinProductIds.keys) {
          if (productId.endsWith('.$pack')) {
            coinProductIds[pack] = productId;
          }
        }
      }
    } catch (_) {
      /* keep defaults */
    }
  }

  String get platform {
    if (kIsWeb) return 'web';
    if (Platform.isIOS) return 'ios';
    return 'android';
  }

  Future<void> initialize() async {
    _updatesSub ??= _iap.purchaseStream.listen(
      _onPurchaseUpdates,
      onError: (Object e) {
        for (final c in _pending.values) {
          if (!c.isCompleted) c.completeError(e);
        }
        _pending.clear();
        _restoreBatch?.fail(e);
      },
    );
  }

  void dispose() {
    _updatesSub?.cancel();
    _updatesSub = null;
    _restoreBatch?.cancel();
    _restoreBatch = null;
  }

  Future<bool> get storeAvailable async {
    if (kIsWeb) return false;
    try {
      return await _iap.isAvailable();
    } catch (_) {
      return false;
    }
  }

  Future<Map<String, dynamic>> purchaseSubscription(String tier) async {
    await initialize();
    final productId = subscriptionProductIds[tier];
    if (productId == null) {
      throw ArgumentError('unknown_tier');
    }

    if (!await storeAvailable) {
      return _verifyDevStub(productId, tier);
    }

    final response = await _iap.queryProductDetails({productId});
    if (response.error != null) {
      throw StateError(response.error!.message);
    }
    if (response.notFoundIDs.isNotEmpty || response.productDetails.isEmpty) {
      return _verifyDevStub(productId, tier);
    }

    final product = response.productDetails.first;
    final completer = Completer<Map<String, dynamic>>();
    _pending[productId] = completer;

    final started = await _iap.buyNonConsumable(
      purchaseParam: PurchaseParam(productDetails: product),
    );
    if (!started) {
      _pending.remove(productId);
      return _verifyDevStub(productId, tier);
    }

    return completer.future.timeout(
      const Duration(minutes: 5),
      onTimeout: () {
        _pending.remove(productId);
        throw TimeoutException('purchase_timeout');
      },
    );
  }

  Future<Map<String, dynamic>> purchaseCoins(String pack) async {
    await initialize();
    final productId = coinProductIds[pack];
    if (productId == null) {
      throw ArgumentError('unknown_coin_pack');
    }

    if (!await storeAvailable) {
      return _verifyDevStub(productId, pack);
    }

    final response = await _iap.queryProductDetails({productId});
    if (response.error != null) {
      throw StateError(response.error!.message);
    }
    if (response.notFoundIDs.isNotEmpty || response.productDetails.isEmpty) {
      return _verifyDevStub(productId, pack);
    }

    final product = response.productDetails.first;
    final completer = Completer<Map<String, dynamic>>();
    _pending[productId] = completer;

    final started = await _iap.buyConsumable(
      purchaseParam: PurchaseParam(productDetails: product),
    );
    if (!started) {
      _pending.remove(productId);
      return _verifyDevStub(productId, pack);
    }

    return completer.future.timeout(
      const Duration(minutes: 5),
      onTimeout: () {
        _pending.remove(productId);
        throw TimeoutException('purchase_timeout');
      },
    );
  }

  /// Re-sync App Store / Play subscriptions (required for iOS restore flow).
  Future<int> restorePurchases() async {
    await initialize();
    if (!await storeAvailable) {
      return 0;
    }

    _restoreBatch?.cancel();
    _restoreBatch = _RestoreBatch();
    await _iap.restorePurchases();
    _restoreBatch!.armSettleTimer();
    return _restoreBatch!.wait();
  }

  Future<void> _onPurchaseUpdates(List<PurchaseDetails> purchases) async {
    for (final purchase in purchases) {
      final productId = purchase.productID;
      final pending = _pending[productId];

      if (purchase.status == PurchaseStatus.pending) {
        continue;
      }

      if (purchase.status == PurchaseStatus.error) {
        pending?.completeError(
          StateError(purchase.error?.message ?? 'purchase_failed'),
        );
        _pending.remove(productId);
        continue;
      }

      if (purchase.status == PurchaseStatus.canceled) {
        pending?.completeError(StateError('purchase_canceled'));
        _pending.remove(productId);
        continue;
      }

      if (purchase.status == PurchaseStatus.purchased ||
          purchase.status == PurchaseStatus.restored) {
        try {
          final result = await _api.verifyIap(
            platform: platform,
            productId: productId,
            receipt: _receiptPayload(purchase),
            transactionId: purchase.purchaseID ?? purchase.transactionDate,
          );
          if (purchase.pendingCompletePurchase) {
            await _iap.completePurchase(purchase);
          }
          pending?.complete(result);
          _restoreBatch?.record();
        } catch (e) {
          pending?.completeError(e);
          _restoreBatch?.fail(e);
        } finally {
          _pending.remove(productId);
        }
      }
    }
  }

  String _receiptPayload(PurchaseDetails purchase) {
    final data = purchase.verificationData.serverVerificationData;
    if (platform == 'android') {
      return 'gp:${purchase.productID}:$data';
    }
    return data;
  }

  Future<Map<String, dynamic>> _verifyDevStub(
    String productId,
    String tier,
  ) async {
    return _api.verifyIap(
      platform: platform == 'web' ? 'android' : platform,
      productId: productId,
      receipt: 'valid_$productId',
      transactionId:
          'dev_stub:$productId-${DateTime.now().millisecondsSinceEpoch}',
    );
  }
}

class _RestoreBatch {
  final Completer<int> _done = Completer<int>();
  int _count = 0;
  Timer? _settleTimer;
  bool _finished = false;

  void record() {
    _count++;
    armSettleTimer();
  }

  void armSettleTimer() {
    _settleTimer?.cancel();
    _settleTimer = Timer(const Duration(milliseconds: 1500), _finish);
  }

  void fail(Object _) {
    if (!_done.isCompleted) {
      _finish();
    }
  }

  void cancel() {
    _settleTimer?.cancel();
    if (!_done.isCompleted) {
      _done.complete(_count);
    }
    _finished = true;
  }

  void _finish() {
    if (_finished || _done.isCompleted) return;
    _finished = true;
    _settleTimer?.cancel();
    _done.complete(_count);
  }

  Future<int> wait() {
    return _done.future.timeout(
      const Duration(seconds: 30),
      onTimeout: () => _count,
    );
  }
}
