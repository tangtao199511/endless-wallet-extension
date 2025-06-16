# Endless Wallet Browser Extension

Author: Tao Tang

## Developed Features:

We have developed a browser extension that extends the functionality of the Endless wallet, leveraging the official wallet APIs provided by Endless. This plugin enables users to access their Endless wallet at any time directly from the browser and view essential account information. It also supports an integrated AI assistant feature. Currently, the AI assistant can automatically summarize recent transaction activity in the user’s account, and upcoming versions will support sending these summaries directly to the user’s Luffa bot.

## Feature Overview:

•	Once the plugin is installed, users can access Endless Wallet functionality immediately.

•	After connecting the wallet via the extension, users can view key wallet information.

•	By clicking Generate Report within the wallet interface, the integrated AI will analyze and summarize the user’s recent transaction history, offering insights and suggestions.

•	Users can select their preferred large language model (LLM) to power the assistant, including either OpenAI or a self-hosted LLM service.
   
## Implementation Details:

The extension is built using standard browser extension technologies: HTML + JavaScript + CSS, ensuring maximum compatibility across different environments.

Core functionalities are implemented via two SDKs:

•	endless-ts-sdk

•	endless-web3-sdk

Although the current feature set is limited, the foundational framework has been successfully established. Any additional feature supported by the SDK can theoretically be integrated into the extension in future iterations.

The current AI assistant helps users synthesize transaction data. In future releases, we plan to integrate it with the Luffa chatbot, allowing users to trigger functions from within the extension and have the AI-generated summary automatically delivered to their Luffa bot.
