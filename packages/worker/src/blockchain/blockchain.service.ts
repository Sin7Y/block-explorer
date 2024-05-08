import { Injectable, OnModuleInit, Logger } from "@nestjs/common";
import { BigNumber } from "ethers";
import { utils, types } from "zksync-web3";
import { Histogram } from "prom-client";
import { InjectMetric } from "@willsoto/nestjs-prometheus";
import { EventType, Listener } from "@ethersproject/abstract-provider";
import { ConfigService } from "@nestjs/config";
import { setTimeout } from "timers/promises";
import { JsonRpcProviderBase } from "../rpcProvider";
import { BLOCKCHAIN_RPC_CALL_DURATION_METRIC_NAME, BlockchainRpcCallMetricLabel } from "../metrics";
import { RetryableContract } from "./retryableContract";
import { L2ToL1Log } from "zksync-web3/build/src/types";

export interface BridgeAddresses {
  l1Erc20DefaultBridge: string;
  l2Erc20DefaultBridge: string;
}

export interface TraceTransactionResult {
  type: string;
  from: string;
  to: string;
  error: string | null;
  revertReason: string | null;
}

@Injectable()
export class BlockchainService implements OnModuleInit {
  private readonly logger: Logger;
  private readonly rpcCallsDefaultRetryTimeout: number;
  private readonly rpcCallsQuickRetryTimeout: number;
  private readonly errorCodesForQuickRetry: string[] = ["NETWORK_ERROR", "ECONNRESET", "ECONNREFUSED", "TIMEOUT"];
  public bridgeAddresses: BridgeAddresses;

  public constructor(
    configService: ConfigService,
    private readonly provider: JsonRpcProviderBase,
    @InjectMetric(BLOCKCHAIN_RPC_CALL_DURATION_METRIC_NAME)
    private readonly rpcCallDurationMetric: Histogram<BlockchainRpcCallMetricLabel>
  ) {
    this.logger = new Logger(BlockchainService.name);
    this.rpcCallsDefaultRetryTimeout = configService.get<number>("blockchain.rpcCallDefaultRetryTimeout");
    this.rpcCallsQuickRetryTimeout = configService.get<number>("blockchain.rpcCallQuickRetryTimeout");
  }

  private async rpcCall<T>(action: () => Promise<T>, functionName: string): Promise<T> {
    const stopDurationMeasuring = this.rpcCallDurationMetric.startTimer();
    try {
      const result = await action();
      stopDurationMeasuring({ function: functionName });
      return result;
    } catch (error) {
      this.logger.error({ message: error.message, code: error.code }, error.stack);
      if (this.errorCodesForQuickRetry.includes(error.code)) {
        await setTimeout(this.rpcCallsQuickRetryTimeout);
      } else {
        await setTimeout(this.rpcCallsDefaultRetryTimeout);
      }
    }
    return this.rpcCall(action, functionName);
  }

  public async getL1BatchNumber(): Promise<number> {
    return await this.rpcCall(async () => {
      return await this.provider.getL1BatchNumber();
    }, "getL1BatchNumber");
  }

  public async getL1BatchDetails(batchNumber: number): Promise<types.BatchDetails> {
    return await this.rpcCall(async () => {
      const batchDetails = await this.provider.getL1BatchDetails(batchNumber);
      if (batchDetails && batchNumber === 0) {
        batchDetails.committedAt = batchDetails.provenAt = batchDetails.executedAt = new Date(0);
      }
      return batchDetails;
    }, "getL1BatchDetails");
  }

  private async genBlock(): Promise<types.Block> {
    return new Promise((resolve, reject) => {
      // const block: types.Block = mock<types.Block>({ l1BatchNumber: 10, l1BatchTimestamp: 10 });
      const block = {
        l1BatchNumber: 10,
        l1BatchTimestamp: 10,
        transactions: new Array<string>("9c8a501be105ab9d80da8847a3bb8818e896e06715170b108ff650a06699c3a7"),
        hash: "good",
        parentHash: "",
        number: 16,
        timestamp: 1,
        nonce: "",
        difficulty: 1,
        _difficulty: BigNumber.from(1),
        gasLimit: BigNumber.from(2),
        gasUsed: BigNumber.from(3),
        miner: "9c8a501be105ab9d80da8847a3bb8818e896e06715170b108ff650a06699c3a7",
        extraData: "9c8a501be105ab9d80da8847a3bb8818e896e06715170b108ff650a06699c3a7",
        baseFeePerGas: BigNumber.from(0),
      };
      resolve(block);
    });
  }

  public async getBlock(blockHashOrBlockTag: types.BlockTag): Promise<types.Block> {
    return await this.rpcCall(async () => {
      return await this.provider.getBlock(blockHashOrBlockTag);
    }, "getBlock");
  }

  public async getBlockNumber(): Promise<number> {
    return await this.rpcCall(async () => {
      return await this.provider.getBlockNumber();
    }, "getBlockNumber");
  }

  public async getBlockDetails(blockNumber: number): Promise<types.BlockDetails> {
    return await this.rpcCall(async () => {
      return await this.provider.getBlockDetails(blockNumber);
    }, "getBlockDetails");
  }
  private async genTransactionReceipt(): Promise<types.TransactionReceipt> {
    return new Promise((resolve, reject) => {
      // const block: types.Block = mock<types.Block>({ l1BatchNumber: 10, l1BatchTimestamp: 10 });
      const log = {
        l1BatchNumber: 16,
        blockNumber: 16,
        blockHash: "good",
        transactionIndex: 10,
        removed: false,
        address: "us",
        data: "data",
        topics: new Array<string>(""),
        transactionHash: "good",
        logIndex: 10,
      };
      const l2ToL1Log = {
        blockNumber: 16,
        blockHash: "good",
        l1BatchNumber: 0,
        transactionIndex: 10,
        txIndexInL1Batch: 10,
        shardId: 10,
        isService: false,
        sender: "us",
        key: "us",
        value: "us",
        transactionHash: "good",
        logIndex: 10,
      };
      const transactionReceipt = {
        l1BatchNumber: 10,
        l1BatchTxIndex: 10,
        logs: new Array<types.Log>(log),
        l2ToL1Logs: new Array<L2ToL1Log>(l2ToL1Log),
        to: "sfdsdf",
        from: "gsdfs",
        contractAddress: "gsdfs",
        transactionIndex: 10,
        root: "gfds",
        gasUsed: BigNumber.from(0),
        logsBloom: "sdfsdf",
        blockHash: "good",
        transactionHash: "good",
        blockNumber: 16,
        confirmations: 3,
        cumulativeGasUsed: BigNumber.from(45),
        effectiveGasPrice: BigNumber.from(75),
        byzantium: false,
        type: 54,
        status: 5,
      };
      resolve(transactionReceipt);
    });
  }

  private async genTransaction(): Promise<types.TransactionResponse> {
    return new Promise((resolve, reject) => {
      const transactionReceiptPromise = this.genTransactionReceipt();
      const waitFinalize = async (): Promise<types.TransactionReceipt> => {
        return transactionReceiptPromise;
      };
      const wait = (confirmations?: number): Promise<types.TransactionReceipt> => {
        return transactionReceiptPromise;
      };
      const transaction = {
        l1BatchNumber: 0,
        l1BatchTxIndex: 0,
        waitFinalize: waitFinalize,
        hash: "good",
        blockNumber: 16,
        blockHash: "good",
        timestamp: 0,
        confirmations: 0,
        // Not optional (as it is in Transaction)
        from: "",
        // The raw transaction
        raw: "",
        // This function waits until the transaction has been mined
        wait: wait,
        gasLimit: BigNumber.from(0),
        gasPrice: BigNumber.from(0),
        nonce: 0,
        data: "",
        value: BigNumber.from(0),
        chainId: 0,
      };
      resolve(transaction);
    });
  }

  public async getTransaction(transactionHash: string): Promise<types.TransactionResponse> {
    return await this.rpcCall(async () => {
      return await this.provider.getTransaction(transactionHash);
    }, "getTransaction");
  }

  private async genTransactionDetail(): Promise<types.TransactionDetails> {
    return new Promise((resolve, reject) => {
      const transactionDetail = {
        isL1Originated: false,
        status: "",
        fee: "",
        initiatorAddress: "",
        receivedAt: new Date(),
      };
      resolve(transactionDetail);
    });
  }

  public async getTransactionDetails(transactionHash: string): Promise<types.TransactionDetails> {
    return await this.rpcCall(async () => {
      return await this.provider.getTransactionDetails(transactionHash);
    }, "getTransactionDetails");
  }

  public async getTransactionReceipt(transactionHash: string): Promise<types.TransactionReceipt> {
    return await this.rpcCall(async () => {
      return await this.provider.getTransactionReceipt(transactionHash);
    }, "getTransactionReceipt");
  }

  public async getLogs(eventFilter: { fromBlock: number; toBlock: number }): Promise<types.Log[]> {
    return await this.rpcCall(async () => {
      return await this.provider.getLogs(eventFilter);
    }, "getLogs");
  }

  public async getCode(address: string): Promise<string> {
    return await this.rpcCall(async () => {
      return await this.provider.getCode(address);
    }, "getCode");
  }

  public async getDefaultBridgeAddresses(): Promise<{ erc20L1: string; erc20L2: string }> {
    return await this.rpcCall(async () => {
      return await this.provider.getDefaultBridgeAddresses();
    }, "getDefaultBridgeAddresses");
  }

  private async genDebugTraceTransaction(): Promise<TraceTransactionResult> {
    return new Promise((resolve, reject) => {
      const traceTransactionResult = {
        type: "",
        from: "",
        to: "",
        error: "",
        revertReason: "",
      };
      resolve(traceTransactionResult);
    });
  }

  public async debugTraceTransaction(txHash: string, onlyTopCall = false): Promise<TraceTransactionResult> {
    return await this.rpcCall(async () => {
      return await this.provider.send("debug_traceTransaction", [
        txHash,
        {
          tracer: "callTracer",
          tracerConfig: { onlyTopCall },
        },
      ]);
    }, "debugTraceTransaction");
  }

  public async on(eventName: EventType, listener: Listener): Promise<void> {
    this.provider.on(eventName, listener);
  }

  public async getERC20TokenData(contractAddress: string): Promise<{ symbol: string; decimals: number; name: string }> {
    const erc20Contract = new RetryableContract(contractAddress, utils.IERC20, this.provider);
    const [symbol, decimals, name] = await Promise.all([
      erc20Contract.symbol(),
      erc20Contract.decimals(),
      erc20Contract.name(),
    ]);
    return {
      symbol,
      decimals,
      name,
    };
  }

  public async getBalance(address: string, blockNumber: number, tokenAddress: string): Promise<BigNumber> {
    const blockTag = this.provider.formatter.blockTag(blockNumber);

    if (utils.isETH(tokenAddress)) {
      return await this.rpcCall(async () => {
        return await this.provider.getBalance(address, blockTag);
      }, "getBalance");
    }

    const erc20Contract = new RetryableContract(tokenAddress, utils.IERC20, this.provider);
    return await erc20Contract.balanceOf(address, { blockTag });
  }

  public async onModuleInit(): Promise<void> {
    // const bridgeAddresses = await this.getDefaultBridgeAddresses();
    //
    // this.bridgeAddresses = {
    //   l1Erc20DefaultBridge: bridgeAddresses.erc20L1.toLowerCase(),
    //   l2Erc20DefaultBridge: bridgeAddresses.erc20L2.toLowerCase(),
    // };
    //
    // this.logger.debug(`L2 ERC20 Bridge is set to: ${this.bridgeAddresses.l2Erc20DefaultBridge}`);
  }
}
