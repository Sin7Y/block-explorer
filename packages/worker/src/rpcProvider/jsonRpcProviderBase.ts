import { OlaProvider } from "olaos-api-js";

export type ProviderState = "connecting" | "open" | "closed";

export abstract class JsonRpcProviderBase extends OlaProvider {
  public abstract getState(): ProviderState;
}
