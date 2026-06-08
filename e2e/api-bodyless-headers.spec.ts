import { test, expect } from "@playwright/test";

/**
 * Clients may send Content-Type: application/json on bodyless DELETE/POST.
 * API strips the header when there is no body so requests still succeed.
 */
test("bodyless DELETE/POST succeed with application/json Content-Type", async ({
  request,
}) => {
  const boot = await request.post("/v1/users/bootstrap");
  const { token } = (await boot.json()) as { token: string };
  const auth = { Authorization: `Bearer ${token}` };
  const jsonCt = { ...auth, "Content-Type": "application/json" };

  const char = await request.post("/v1/characters", {
    headers: auth,
    data: {
      name: "BodylessHdr",
      personality: "溫柔",
      backstory: "測試",
      speakingStyle: "口語",
    },
  });
  const { characterId } = (await char.json()) as { characterId: string };

  await request.post("/v1/chat", {
    headers: auth,
    data: { characterId, content: "hdr-test", mode: "simple" },
  });

  const listed = await request.get(
    `/v1/characters/${characterId}/messages?limit=5`,
    { headers: auth },
  );
  const msgId = (
    (await listed.json()) as { messages: { id: string }[] }
  ).messages[0]!.id;

  const delMsg = await request.delete(
    `/v1/characters/${characterId}/messages/${msgId}`,
    { headers: jsonCt },
  );
  expect(delMsg.ok()).toBeTruthy();

  await request.post("/v1/chat", {
    headers: auth,
    data: { characterId, content: "hdr-test-2", mode: "simple" },
  });

  const clear = await request.delete(
    `/v1/characters/${characterId}/messages`,
    { headers: jsonCt },
  );
  expect(clear.ok()).toBeTruthy();

  const clearMem = await request.delete(
    `/v1/characters/${characterId}/memories`,
    { headers: jsonCt },
  );
  expect(clearMem.ok()).toBeTruthy();

  const reset = await request.post(
    `/v1/characters/${characterId}/relationship/reset`,
    { headers: jsonCt },
  );
  expect(reset.ok()).toBeTruthy();
});
