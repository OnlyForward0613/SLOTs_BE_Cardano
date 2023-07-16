import fs from 'fs';
import { Blockfrost, Lucid } from 'lucid-cardano';
import { config } from './config.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);

const __dirname = path.dirname(__filename);

dotenv.config({
  path: '.env'
});

export function saveData(content) {
  fs.writeFileSync (
    __dirname+'/database/data.json',
    JSON.stringify(content)
  );
}

export function loadData() {
  return fs.existsSync(__dirname+'/database/data.json')
    ? JSON.parse(fs.readFileSync(__dirname+'/database/data.json').toString())
    : undefined;
}

export const blockFrost = new Blockfrost(
  config.BLOCKFROST_API_URL,
  config.BLOCKFROST_API_KEY,
)

export const lucid = await Lucid.new(
  blockFrost,
  config.CARDANO_NETWORK == 0 ? config.PREVIEW_OR_PREPROD : 'Mainnet'
)

lucid.selectWalletFromPrivateKey(process.env.PRIVATE_KEY);

export const sendAdaFromProject = async (addr, amt) => {
  console.log("4")

  console.log("sendAdaFromProject,", addr, await lucid.wallet.address());
  const amount = BigInt(Number(amt) * 1000000);
  console.log("5")

  const tx = await lucid
      .newTx()
      .payToAddress(addr, { lovelace: amount })
      .complete();

  const signedTx = await tx.sign().complete();
  const txHash = await signedTx.submit();
  console.log(txHash)
  return txHash;
}

export const sendTokenFromProject = async (addr, amt, policyId) => {

  console.log("sendAdaFromProject,", addr, await lucid.wallet.address());
  const amount = BigInt(Number(amt) * 1000000);
  const tx = await lucid
      .newTx()
      .payToAddress(addr, { policyId: amount })
      .complete();

  const signedTx = await tx.sign().complete();
  const txHash = await signedTx.submit();
  return txHash;
}

