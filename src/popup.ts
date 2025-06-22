import {
  Endless,
  EndlessConfig,
  Network,
  AccountAddress
} from "@endlesslab/endless-ts-sdk";

// Add this line to let TypeScript know about the 'chrome' global variable
declare const chrome: any;
import {
  EndlessJsSdk,
  UserResponseStatus
} from "@endlesslab/endless-web3-sdk";

// SDK 实例
const web3sdk = new EndlessJsSdk({ network: Network.TESTNET });
const tsClient = new Endless(new EndlessConfig({ network: Network.TESTNET }));

// DOM 元素获取
const logoCenter = document.getElementById("logo-center") as HTMLImageElement;
const logoCorner = document.getElementById("logo-corner") as HTMLImageElement;
const connectBtn = document.getElementById("connect-btn")!;
const disconnectBtn = document.getElementById("disconnect-btn")!;
const copyBtn = document.getElementById("copy-address");
const signBtn = document.getElementById("sign-message-btn")!;
const walletInfo = document.getElementById("wallet-info")!;
const walletAddressDisplay = document.getElementById("wallet-address")!;
const networkDisplay = document.getElementById("network")!;
const balanceDisplay = document.getElementById("balance")!;
const reportBtn = document.getElementById("generate-report-btn")!;
const futureBtn = document.getElementById("future-fn-btn")!;
const reportResult = document.getElementById("report-result")!;
const transactionList = document.getElementById("transaction-list")!;
const aiProviderSelect = document.getElementById("ai-provider") as HTMLSelectElement;
const openaiKeyInput = document.getElementById("openai-api-key") as HTMLInputElement;
const settingsBtn = document.getElementById("settings-btn") as HTMLButtonElement;
const settingsModal = document.getElementById("settings-modal") as HTMLDivElement;
const closeSettingsBtn = document.getElementById("close-settings-btn") as HTMLButtonElement;
const saveSettingsBtn = document.getElementById("save-settings-btn") as HTMLButtonElement;

const aiProviderInput = document.getElementById("ai-provider") as HTMLSelectElement;
const luffaIdInput = document.getElementById("luffa-id-setting") as HTMLInputElement;
const uidOftheUser = document.getElementById("uid-of-the-user") as HTMLInputElement;
const openaiKeyBox = document.getElementById("openai-key-box")!;


// 📋 点击复制地址按钮
const copyConfirm = document.getElementById("copy-confirm");
// 从本地存储加载 OpenAI API key

const aiSelectMain = document.getElementById("ai-provider") as HTMLSelectElement;


aiSelectMain.value = localStorage.getItem("ai_provider") || "openai";


let connectedAddress: string | null = null;
function shortenAddress(addr: string): string {
  return addr.slice(0, 6) + "..." + addr.slice(-4);
}

function toHex(buffer: Uint8Array): string {
  return Array.from(buffer).map(b => b.toString(16).padStart(2, '0')).join('');
}

function preloadKeysFromLocalStorage() {
  const savedOpenAIKey = localStorage.getItem("openai_api_key");
  const savedLuffaID = localStorage.getItem("luffa_bot_id");
  const savedUiduser = localStorage.getItem("uid_of_the_user");

  if (savedOpenAIKey) {
    openaiKeyInput.value = savedOpenAIKey;
  } else {
    openaiKeyInput.value = "";  // 保持 placeholder
  }

  if (savedLuffaID) {
    luffaIdInput.value = savedLuffaID;
  } else {
    luffaIdInput.value = "";  // 保持 placeholder
  }

  if (savedUiduser) {
    uidOftheUser.value = savedUiduser;
  } else {
    uidOftheUser.value = "";  // 保持 placeholder
  }
}



function switchLogoOnLogin() {
  logoCenter.classList.add("hidden");
  logoCorner.classList.remove("hidden");
  settingsBtn.classList.remove("hidden");
}

function switchLogoOnLogout() {
  logoCenter.classList.remove("hidden");
  logoCorner.classList.add("hidden");
  settingsBtn.classList.add("hidden");
}

// AI Provider 下拉框控制 key 显示
aiProviderSelect.addEventListener("change", () => {
  openaiKeyBox.style.display = aiProviderSelect.value === "openai" ? "block" : "none";
});

// 🔗 click to connect the wallet btn
connectBtn.addEventListener("click", async () => {
  try {
    const connectRes = await web3sdk.connect();
    console.log("🔗 Connecting to wallet...");

    if (connectRes.status !== UserResponseStatus.APPROVED) {
      alert("❌ Wallet connection denied");
      return;
    }
    switchLogoOnLogin();
    connectedAddress = connectRes.args.account;
    walletAddressDisplay.textContent = shortenAddress(connectedAddress);
    networkDisplay.textContent = Network.TESTNET;
    connectBtn.style.display = "none";
    walletInfo.style.display = "block";
    const balance = await tsClient.viewEDSBalance(
      AccountAddress.fromString(connectedAddress)
    );
    balanceDisplay.textContent = (Number(balance) / 1e8).toFixed(4);
    console.log("🟢 Connected to wallet:", connectedAddress, "EDS:", balance.toString());

    await loadRecentTransactions();
    await preloadKeysFromLocalStorage();
  } catch (err) {
    console.error("🔴 Wallet connection failed:", err);
    alert("Failed to connect wallet.");
  }
});

// 📝 签名消息
signBtn.addEventListener("click", async () => {
  if (!connectedAddress) return;
  const res = await web3sdk.signMessage({ message: "Sign in to Endless Plugin" });
  if (res.status === UserResponseStatus.APPROVED) {
    const sig = toHex(res.args.signature.toUint8Array());
    console.log("📝 Signature:", sig);
    console.log("🔑 PublicKey:", res.args.publicKey.toString());
    alert("✅ Signed! Check console for signature.");
  } else {
    alert("❌ Signature rejected.");
  }
});

if (copyBtn) {
  copyBtn.addEventListener("click", async () => {
    if (!connectedAddress) return;
    await navigator.clipboard.writeText(connectedAddress);
    if (copyConfirm) {
      copyConfirm.style.display = "inline";
      setTimeout(() => {
        if (copyConfirm) {
          copyConfirm.style.display = "none";
        }
      }, 2000);
    }
  });
}



// 🔌 断开连接
disconnectBtn.addEventListener("click", async () => {
  await web3sdk.disconnect();
  connectedAddress = null;
  walletInfo.style.display = "none";
  connectBtn.style.display = "inline-block";
});
switchLogoOnLogout();



// ✅ 获取交易记录
async function loadRecentTransactions() {
  if (!connectedAddress) return;
  try {
    const txns = await tsClient.getAccountTransactions({
      accountAddress: AccountAddress.fromString(connectedAddress),
      options: { offset: 0 }
    });
    transactionList.innerHTML = "";
    txns.forEach((txn: any) => {
      console.log("📜 Transaction:", txn);
      //save the txn to localStorage log file
      
      const item = document.createElement("li");
      item.textContent = `Hash: ${txn.hash?.slice(0, 5) || "N/A"}... | Type: ${txn.type}`;
      transactionList.appendChild(item);
    });
  } catch (err) {
    console.error("❌ Failed to load transactions", err);
  }
}

// 🧠 调用 AI 生成报告
async function generateReportText(balance: string, txs: any[]): Promise<string> {
  const txSummary = txs.map((tx, i) => {
    const sender = tx.sender;
    const receiver = tx.payload?.arguments?.[0] || "(unknown)";
    const amount = tx.payload?.arguments?.[1] || "(unknown)";
    const time = new Date(Number(tx.timestamp) / 1e6).toLocaleString();
    return `${i + 1}. On ${time}, ${sender} sent ${amount} to ${receiver}`;
  }).join("\n");

  const prompt = `This wallet has a current balance of ${balance} EDS. Below are the last ${txs.length} transactions:\n\n${txSummary}\n\nPlease provide a 2-3 sentence summary of this user's spending pattern and wallet health in plain English.`;

  const provider = aiProviderSelect.value;
  if (provider === "openai") {
    const key = openaiKeyInput.value.trim();
    if (!key) return "⚠️ Please provide OpenAI API key.";

    const aiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${key}`
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }]
      })
    });
    const data = await aiRes.json();
    return data.choices?.[0]?.message?.content || "⚠️ Failed to get AI response.";
  } else {
    return "⚠️ Ollama not supported in current version.";
  }
}

// send to Luffa Bot
async function sendToLuffaBot(message: string): Promise<string> {
  const secret = localStorage.getItem("openai_api_key") || "";
  const uid = localStorage.getItem("luffa_bot_id") || "";

  if (!secret || !uid) {
    return "⚠️ Missing OpenAI Key or Luffa Bot ID.";
  }

  return new Promise((resolve) => {
    chrome.runtime.sendMessage(
      {
        type: "SEND_TO_LUFFA",
        payload: { secret, uid, message }
      },
      (response: any) => {
        if (chrome.runtime.lastError) {
          resolve("🔴 Failed to send: " + chrome.runtime.lastError.message);
        } else if (response.success) {
          resolve("✅ Report sent to Luffa bot.");
        } else {
          resolve("⚠️ Luffa send failed: " + response.error);
        }
      }
    );
  });
}


// 🎯 点击生成报告
reportBtn.addEventListener("click", async () => {
  
  if (!connectedAddress) return;
  reportResult.textContent = "📊 Generating report...";
  console.log("🔍 Generating report for address:", connectedAddress);
  try {
    const balance = await tsClient.viewEDSBalance(AccountAddress.fromString(connectedAddress));
    const eds = (Number(balance) / 1e8).toFixed(4);
    const txDetails = await tsClient.getAccountTransactions({
      accountAddress: AccountAddress.fromString(connectedAddress),
      options: { offset: 0 }
    });
    const summary = await generateReportText(eds, txDetails);
    console.log("📄 Report generated:", summary);
    // 将报告发送到 Luffa Bot
    const luffaResponse = await sendToLuffaBot(summary);
    console.log("📤 Luffa Bot response:", luffaResponse);
    reportResult.textContent = `Report sent to user ${uidOftheUser.value} successfully!`;
  } catch (err) {
    console.error("🔴 Report generation failed:", err);
    reportResult.textContent = "⚠️ Failed to generate report.";
  }
});


futureBtn.addEventListener("click", () => {
  alert("🚧 Feature under construction!");
});


// 显示设置弹窗
settingsBtn?.addEventListener("click", () => {
  settingsModal.classList.remove("hidden");

  // 预填已保存设置
  aiProviderInput.value =  "openai";
  openaiKeyInput.value = localStorage.getItem("openai_api_key") || "";
  luffaIdInput.value = localStorage.getItem("luffa_bot_id") || "";
  uidOftheUser.value = localStorage.getItem("uid_of_the_user") || "";
});

// 隐藏设置弹窗
closeSettingsBtn?.addEventListener("click", () => {
  settingsModal.classList.add("hidden");
});

// 保存设置
saveSettingsBtn?.addEventListener("click", () => {
  localStorage.setItem("openai_api_key", openaiKeyInput.value);
  localStorage.setItem("luffa_bot_id", luffaIdInput.value);
  localStorage.setItem("uid_of_the_user", uidOftheUser.value);
  alert("✅ Settings saved!");
  settingsModal.classList.add("hidden");
});