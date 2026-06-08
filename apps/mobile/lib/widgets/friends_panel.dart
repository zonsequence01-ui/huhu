import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../services/huhu_api.dart';
import '../services/ui_strings.dart';

Future<void> showHuhuFriendsDialog(
  BuildContext context, {
  required HuhuApi api,
  String? initialInviteCode,
}) async {
  final u = UiStrings.instance;
  final codeCtrl = TextEditingController(text: initialInviteCode ?? '');
  final searchCtrl = TextEditingController();
  var searchHits = <Map<String, dynamic>>[];
  try {
    final me = await api.getMe();
    final myCode = me['inviteCode'] as String? ?? '—';
    final inviteLink = me['inviteLink'] as String?;
    final requests = await api.listFriendRequests();
    final friends = await api.listFriends();
    final blocked = await api.listBlockedUsers();
    Map<String, dynamic>? qr;
    try {
      qr = await api.getInviteQr();
    } catch (_) {
      qr = null;
    }
    final qrWidget = qr != null && qr['dataUrl'] is String
        ? _inviteQrImage(qr['dataUrl'] as String, u.t('inviteQrAlt'))
        : null;
    if (!context.mounted) return;
    await showDialog<void>(
      context: context,
      builder: (dialogCtx) {
        return StatefulBuilder(
          builder: (ctx, setDialogState) {
            Future<void> runSearch() async {
              final q = searchCtrl.text.trim();
              if (q.length < 2) {
                ScaffoldMessenger.of(ctx).showSnackBar(
                  SnackBar(content: Text(u.t('searchFriendsMinLength'))),
                );
                return;
              }
              try {
                final hits = await api.searchUsers(q);
                setDialogState(() => searchHits = hits);
              } catch (e) {
                if (!ctx.mounted) return;
                ScaffoldMessenger.of(ctx).showSnackBar(
                  SnackBar(content: Text('$e')),
                );
              }
            }

            final incoming =
            (requests['incoming'] as List<dynamic>?)
                ?.cast<Map<String, dynamic>>() ??
            [];
        final outgoing =
            (requests['outgoing'] as List<dynamic>?)
                ?.cast<Map<String, dynamic>>() ??
            [];
        return AlertDialog(
          title: Text(u.t('friendsDialogTitle')),
          content: SingleChildScrollView(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  u.t('inviteCodeLabel'),
                  style: Theme.of(ctx).textTheme.labelLarge,
                ),
                const SizedBox(height: 4),
                SelectableText(
                  myCode,
                  style: Theme.of(ctx).textTheme.titleMedium,
                ),
                Wrap(
                  spacing: 4,
                  children: [
                    TextButton(
                      onPressed: myCode == '—'
                          ? null
                          : () async {
                              await Clipboard.setData(
                                ClipboardData(text: myCode),
                              );
                              if (ctx.mounted) {
                                ScaffoldMessenger.of(ctx).showSnackBar(
                                  SnackBar(
                                    content: Text(u.t('inviteCodeCopied')),
                                  ),
                                );
                              }
                            },
                      child: Text(u.t('copyInviteCode')),
                    ),
                    if (inviteLink != null && inviteLink.isNotEmpty)
                      TextButton(
                        onPressed: () async {
                          await Clipboard.setData(
                            ClipboardData(text: inviteLink),
                          );
                          if (ctx.mounted) {
                            ScaffoldMessenger.of(ctx).showSnackBar(
                              SnackBar(
                                content: Text(u.t('inviteLinkCopied')),
                              ),
                            );
                          }
                        },
                        child: Text(u.t('copyInviteLink')),
                      ),
                  ],
                ),
                if (qrWidget != null) ...[
                  const SizedBox(height: 8),
                  qrWidget,
                ],
                if (initialInviteCode != null &&
                    initialInviteCode.isNotEmpty) ...[
                  const SizedBox(height: 4),
                  Text(
                    u.t('inviteDeepLinkHint'),
                    style: Theme.of(ctx).textTheme.bodySmall,
                  ),
                ],
                const Divider(),
                Text(u.t('friendsIncomingTitle')),
                if (incoming.isEmpty)
                  Text(
                    u.t('friendRequestsEmpty'),
                    style: Theme.of(ctx).textTheme.bodySmall,
                  )
                else
                  for (final row in incoming)
                    ListTile(
                      dense: true,
                      contentPadding: EdgeInsets.zero,
                      title: Text(
                        '${row['displayName']} (${row['fromUserId']})',
                      ),
                      trailing: TextButton(
                        onPressed: () async {
                          try {
                            await api.acceptFriendRequest(
                              row['friendshipId'] as String,
                            );
                            if (ctx.mounted) Navigator.of(ctx).pop();
                            if (!context.mounted) return;
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(content: Text(u.t('friendAccepted'))),
                            );
                            await showHuhuFriendsDialog(
                              context,
                              api: api,
                            );
                          } catch (e) {
                            if (!ctx.mounted) return;
                            ScaffoldMessenger.of(ctx).showSnackBar(
                              SnackBar(content: Text('$e')),
                            );
                          }
                        },
                        child: Text(u.t('confirm')),
                      ),
                    ),
                const SizedBox(height: 8),
                Text(u.t('friendsOutgoingTitle')),
                if (outgoing.isEmpty)
                  Text(
                    u.t('friendRequestsEmpty'),
                    style: Theme.of(ctx).textTheme.bodySmall,
                  )
                else
                  for (final row in outgoing)
                    Text(
                      '${row['displayName']} → ${row['toUserId']}',
                      style: Theme.of(ctx).textTheme.bodySmall,
                    ),
                const SizedBox(height: 8),
                Text(u.t('friendsListTitle')),
                if (friends.isEmpty)
                  Text(
                    u.t('friendRequestsEmpty'),
                    style: Theme.of(ctx).textTheme.bodySmall,
                  )
                else
                  for (final row in friends)
                    ListTile(
                      dense: true,
                      contentPadding: EdgeInsets.zero,
                      title: Text(
                        row['displayName'] as String? ??
                            row['userId'] as String? ??
                            '—',
                      ),
                      trailing: TextButton(
                        onPressed: () async {
                          final uid = row['userId'] as String?;
                          if (uid == null) return;
                          final ok = await showDialog<bool>(
                            context: ctx,
                            builder: (dctx) => AlertDialog(
                              content: Text(u.t('blockUserConfirm')),
                              actions: [
                                TextButton(
                                  onPressed: () =>
                                      Navigator.of(dctx).pop(false),
                                  child: Text(u.t('cancel')),
                                ),
                                FilledButton(
                                  onPressed: () =>
                                      Navigator.of(dctx).pop(true),
                                  child: Text(u.t('blockUser')),
                                ),
                              ],
                            ),
                          );
                          if (ok != true || !ctx.mounted) return;
                          try {
                            await api.blockUser(uid);
                            if (!ctx.mounted) return;
                            Navigator.of(ctx).pop();
                            if (!context.mounted) return;
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(content: Text(u.t('userBlocked'))),
                            );
                            await showHuhuFriendsDialog(context, api: api);
                          } catch (e) {
                            if (!ctx.mounted) return;
                            ScaffoldMessenger.of(ctx).showSnackBar(
                              SnackBar(content: Text('$e')),
                            );
                          }
                        },
                        child: Text(u.t('blockUser')),
                      ),
                    ),
                const SizedBox(height: 8),
                Text(u.t('blockedUsersTitle')),
                if (blocked.isEmpty)
                  Text(
                    u.t('friendRequestsEmpty'),
                    style: Theme.of(ctx).textTheme.bodySmall,
                  )
                else
                  for (final row in blocked)
                    ListTile(
                      dense: true,
                      contentPadding: EdgeInsets.zero,
                      title: Text(
                        row['displayName'] as String? ??
                            row['userId'] as String? ??
                            '—',
                      ),
                      trailing: TextButton(
                        onPressed: () async {
                          final uid = row['userId'] as String?;
                          if (uid == null) return;
                          try {
                            await api.unblockUser(uid);
                            if (!ctx.mounted) return;
                            Navigator.of(ctx).pop();
                            if (!context.mounted) return;
                            await showHuhuFriendsDialog(context, api: api);
                          } catch (e) {
                            if (!ctx.mounted) return;
                            ScaffoldMessenger.of(ctx).showSnackBar(
                              SnackBar(content: Text('$e')),
                            );
                          }
                        },
                        child: Text(u.t('unblockUser')),
                      ),
                    ),
                const SizedBox(height: 12),
                Text(
                  u.t('searchFriendsLabel'),
                  style: Theme.of(ctx).textTheme.labelLarge,
                ),
                const SizedBox(height: 4),
                Row(
                  children: [
                    Expanded(
                      child: TextField(
                        controller: searchCtrl,
                        decoration: InputDecoration(
                          hintText: u.t('searchFriendsPlaceholder'),
                          border: const OutlineInputBorder(),
                          isDense: true,
                        ),
                        onSubmitted: (_) => runSearch(),
                      ),
                    ),
                    TextButton(
                      onPressed: runSearch,
                      child: Text(u.t('searchFriendsBtn')),
                    ),
                  ],
                ),
                if (searchHits.isEmpty && searchCtrl.text.trim().length >= 2)
                  Padding(
                    padding: const EdgeInsets.only(top: 4),
                    child: Text(
                      u.t('searchFriendsEmpty'),
                      style: Theme.of(ctx).textTheme.bodySmall,
                    ),
                  )
                else
                  for (final row in searchHits)
                    ListTile(
                      dense: true,
                      contentPadding: EdgeInsets.zero,
                      title: Text(
                        '${row['displayName'] ?? row['userId']}${row['inviteCode'] != null ? ' (${row['inviteCode']})' : ''}',
                      ),
                      trailing: TextButton(
                        onPressed: () async {
                          final uid = row['userId'] as String?;
                          if (uid == null) return;
                          try {
                            final r = await api.sendFriendRequest(
                              targetUserId: uid,
                            );
                            if (!ctx.mounted) return;
                            Navigator.of(ctx).pop();
                            if (!context.mounted) return;
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(
                                content: Text(
                                  r['autoAccepted'] == true
                                      ? u.t('friendAccepted')
                                      : u.t('friendRequestSent'),
                                ),
                              ),
                            );
                          } catch (e) {
                            if (!ctx.mounted) return;
                            final msg = e.toString().contains('blocked')
                                ? u.t('friendBlocked')
                                : '$e';
                            ScaffoldMessenger.of(ctx).showSnackBar(
                              SnackBar(content: Text(msg)),
                            );
                          }
                        },
                        child: Text(u.t('sendFriendRequestTo')),
                      ),
                    ),
                const SizedBox(height: 12),
                TextField(
                  controller: codeCtrl,
                  textCapitalization: TextCapitalization.characters,
                  decoration: InputDecoration(
                    labelText: u.t('addFriendByCode'),
                    border: const OutlineInputBorder(),
                  ),
                ),
              ],
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(ctx).pop(),
              child: Text(u.t('friendsClose')),
            ),
            FilledButton(
              onPressed: () async {
                final code = codeCtrl.text.trim();
                if (code.isEmpty) return;
                try {
                  final r = await api.sendFriendRequest(inviteCode: code);
                  if (!ctx.mounted) return;
                  Navigator.of(ctx).pop();
                  if (!context.mounted) return;
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text(
                        r['autoAccepted'] == true
                            ? u.t('friendAccepted')
                            : u.t('friendRequestSent'),
                      ),
                    ),
                  );
                } catch (e) {
                  if (!ctx.mounted) return;
                  final msg = e.toString().contains('invite_code_not_found')
                      ? u.t('inviteCodeNotFound')
                      : e.toString().contains('blocked')
                          ? u.t('friendBlocked')
                          : '$e';
                  ScaffoldMessenger.of(ctx).showSnackBar(
                    SnackBar(content: Text(msg)),
                  );
                }
              },
              child: Text(u.t('send')),
            ),
          ],
        );
          },
        );
      },
    );
  } catch (e) {
    if (!context.mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('$e')),
    );
  } finally {
    codeCtrl.dispose();
    searchCtrl.dispose();
  }
}

Widget? _inviteQrImage(String dataUrl, String alt) {
  const prefix = 'data:image/png;base64,';
  if (!dataUrl.startsWith(prefix)) return null;
  try {
    final bytes = base64Decode(dataUrl.substring(prefix.length));
    return Image.memory(
      bytes,
      width: 160,
      height: 160,
      semanticLabel: alt,
    );
  } catch (_) {
    return null;
  }
}
