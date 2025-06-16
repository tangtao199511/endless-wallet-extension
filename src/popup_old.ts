import {
  Endless,
  EndlessConfig,
  Network,
  AccountAddress
} from "@endlesslab/endless-ts-sdk";
import {
  EndlessJsSdk,
  UserResponseStatus
} from "@endlesslab/endless-web3-sdk";

// DOM 元素获取
const connectBtn = document.getElementById("connect-btn")!;
const disconnectBtn = document.getElementById("disconnect-btn")!;
const copyBtn = document.getElementById("copy-address")!;
const signBtn = document.getElementById("sign-message-btn")!;
const walletInfo = document.getElementById("wallet-info")!;
const walletAddressDisplay = document.getElementById("wallet-address")!;
const networkDisplay = document.getElementById("network")!;
const balanceDisplay = document.getElementById("balance")!;
const reportBtn = document.getElementById("generate-report-btn")!;
const reportResult = document.getElementById("report-result")!;
const transactionList = document.getElementById("transaction-list")!;
const aiProviderSelect = document.getElementById("ai-provider") as HTMLSelectElement;
const openaiKeyInput = document.getElementById("openai-key") as HTMLInputElement;
const openaiKeyBox = document.getElementById("openai-key-box")!;

// SDK 实例
const web3sdk = new EndlessJsSdk({ network: Network.TESTNET });
const tsClient = new Endless(new EndlessConfig({ network: Network.TESTNET }));

let connectedAddress: string | null = null;

// AI Provider 下拉框控制 key 显示
aiProviderSelect.addEventListener("change", () => {
  openaiKeyBox.style.display = aiProviderSelect.value === "openai" ? "block" : "none";
});

// 🔗 点击连接钱包按钮
connectBtn.addEventListener("click", async () => {
  try {
    const connectRes = await web3sdk.connect();

    if (connectRes.status !== UserResponseStatus.APPROVED) {
      alert("❌ Wallet connection denied");
      return;
    }

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
  } catch (err) {
    console.error("🔴 Wallet connection failed:", err);
    alert("Failed to connect wallet.");
  }
});

// 📋 点击复制地址按钮
const copyConfirm = document.getElementById("copy-confirm")!;

copyBtn.addEventListener("click", async () => {
  if (!connectedAddress) return;
  await navigator.clipboard.writeText(connectedAddress);
  copyConfirm.style.display = "inline";
  setTimeout(() => {
    copyConfirm.style.display = "none";
  }, 2000);
});

// 📝 签名消息
signBtn.addEventListener("click", async () => {
  if (!connectedAddress) return;
  const res = await web3sdk.signMessage({ message: "Sign in to Endless Plugin" });
  if (res.status === UserResponseStatus.APPROVED) {
    const sig = Buffer.from(res.args.signature.toUint8Array()).toString("hex");
    console.log("📝 Signature:", sig);
    console.log("🔑 PublicKey:", res.args.publicKey.toString());
    alert("✅ Signed! Check console for signature.");
  } else {
    alert("❌ Signature rejected.");
  }
});

// 🔌 断开连接
disconnectBtn.addEventListener("click", async () => {
  await web3sdk.disconnect();
  connectedAddress = null;
  walletInfo.style.display = "none";
  connectBtn.style.display = "inline-block";
});

function shortenAddress(addr: string): string {
  return addr.slice(0, 6) + "..." + addr.slice(-4);
}

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
      const item = document.createElement("li");
      item.textContent = `Hash: ${txn.hash?.slice(0, 10) || "N/A"}... | Type: ${txn.type}`;
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
    const aiRes = await fetch("http://localhost:11434/api/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      },
      body: JSON.stringify({
        model: "qwen3:0.6b",
        prompt,
        stream: false
      })
    });
    const data = await aiRes.json();
    return data.response || "⚠️ Failed to get Ollama response.";
  }
}

// 🎯 点击生成报告
reportBtn.addEventListener("click", async () => {
  if (!connectedAddress) return;
  reportResult.textContent = "📊 Generating report...";

  try {
    const balance = await tsClient.viewEDSBalance(AccountAddress.fromString(connectedAddress));
    const eds = (Number(balance) / 1e8).toFixed(4);
    const txDetails = await tsClient.getAccountTransactions({
      accountAddress: AccountAddress.fromString(connectedAddress),
      options: { offset: 0 }
    });
    const summary = await generateReportText(eds, txDetails);
    reportResult.textContent = summary;
  } catch (err) {
    console.error("🔴 Report generation failed:", err);
    reportResult.textContent = "⚠️ Failed to generate report.";
  }
});
