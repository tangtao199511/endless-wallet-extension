chrome.runtime.onMessage.addListener(
  (
    request: any,
    _sender: chrome.runtime.MessageSender,
    sendResponse: (response?: any) => void
  ) => {
    if (request.type === "SEND_TO_LUFFA") {
      const { secret, uid, message } = request.payload;

      if (!secret || !uid || !message) {
        sendResponse({ success: false, error: "Missing parameters" });
        return;
      }

      fetch("https://apibot.luffa.im/robot/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          secret,
          uid,
          msg: JSON.stringify({ text: message })
        })
      })
        .then(async (res) => {
          if (!res.ok) {
            const text = await res.text();
            sendResponse({ success: false, error: `HTTP ${res.status}: ${text}` });
          } else {
            const data = await res.json();
            sendResponse({ success: true, data });
          }
        })
        .catch((err) => {
          sendResponse({ success: false, error: err.toString() });
        });

      return true; // required for async response
    }
  }
);
