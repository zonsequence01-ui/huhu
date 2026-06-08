import 'package:flutter_test/flutter_test.dart';
import 'package:huhu_mobile/services/iap_purchase_service.dart';

void main() {
  test('default subscription SKUs match backend product ids', () {
    expect(
      IapPurchaseService.defaultSubscriptionProductIds.values,
      containsAll([
        'com.ctrlz.huhu.sub.lite',
        'com.ctrlz.huhu.sub.basic',
        'com.ctrlz.huhu.sub.premium',
      ]),
    );
  });

  test('default coin pack SKUs match backend product ids', () {
    expect(
      IapPurchaseService.defaultCoinProductIds.values,
      containsAll([
        'com.ctrlz.huhu.coins.small',
        'com.ctrlz.huhu.coins.medium',
        'com.ctrlz.huhu.coins.large',
      ]),
    );
  });
}
