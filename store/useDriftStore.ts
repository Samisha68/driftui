import { create } from 'zustand';
import { 
  DriftClient, 
  UserAccount, 
  Wallet, 
  initialize, 
  DriftEnv,
  MarketType,
  convertToNumber,
  PRICE_PRECISION,
  BASE_PRECISION,
  QUOTE_PRECISION,
  ZERO,
  SpotBalanceType,
  calculateEntryPrice,
  getVariant,
  PerpMarketAccount,
  SpotMarketAccount,
  Order
} from '@drift-labs/sdk';
import { Connection, PublicKey, Commitment, Transaction, VersionedTransaction } from '@solana/web3.js';
import { toast } from 'react-hot-toast';

// --- Types for Store State & Data ---
export type TokenBalance = { 
  symbol: string; 
  amount: number; 
  marketIndex: number; 
};
export type PerpPosition = { 
  market: string; 
  direction: 'Long' | 'Short'; 
  entryPrice: number; 
  size: number; 
  marketIndex: number; 
  pnl: number;
};
export type OpenOrder = { 
  market: string; 
  type: string;
  direction: string;
  price: number; 
  size: number; 
  triggerPrice: number; 
  status: string;
  marketIndex: number; 
  marketType: string;
};
export type SubAccountData = { 
  id: number; 
  name: string; 
  balances: TokenBalance[]; 
  positions: PerpPosition[]; 
  orders: OpenOrder[]; 
  userAccount: UserAccount; 
};
export type WalletData = { 
  address: string; 
  subAccounts: SubAccountData[]; 
};

// --- Dummy Data --- 
const DUMMY_WALLET_DATA: Record<string, WalletData> = {
  "connected": {
    address: "ConnectedWalletAbC...",
    subAccounts: [
      {
        id: 0,
        name: "Primary",
        balances: [
          { symbol: "USDC", amount: 5120.75, marketIndex: 0 },
          { symbol: "SOL", amount: 1.25, marketIndex: 1 },
        ],
        positions: [
          { market: "SOL-PERP", direction: "Long", entryPrice: 120.50, size: 0.8, marketIndex: 1, pnl: 0 },
        ],
        orders: [
          { market: "BTC-PERP", type: "Limit", direction: "Short", price: 72000, size: 0.01, status: 'Open', triggerPrice: 0, marketIndex: 2, marketType: 'PERP' }
        ],
        userAccount: {} as UserAccount,
      },
      {
        id: 1,
        name: "Scalping",
        balances: [
          { symbol: "USDC", amount: 1050.00, marketIndex: 0 },
        ],
        positions: [],
        orders: [],
        userAccount: {} as UserAccount,
      },
      {
        id: 2,
        name: "Testing",
        balances: [
          { symbol: "USDC", amount: 250.00, marketIndex: 0 },
        ],
        positions: [
           { market: "ETH-PERP", direction: "Short", entryPrice: 3800, size: 0.1, marketIndex: 3, pnl: 0 },
        ],
        orders: [
          { market: "ETH-PERP", type: "Trigger", direction: "Long", triggerPrice: 3750, size: 0.1, status: 'Open', price: 0, marketIndex: 3, marketType: 'PERP' }
        ],
        userAccount: {} as UserAccount,
      }
    ]
  },
  "arbitraryWalletXYZ": {
    address: "arbitraryWalletXYZ...",
    subAccounts: [
      {
        id: 0,
        name: "Default",
        balances: [{ symbol: "USDC", amount: 100.00, marketIndex: 0 }],
        positions: [],
        orders: [],
        userAccount: {} as UserAccount,
      }
    ]
  }
};

// --- SDK Initialization Helpers --- 
const RPC_ENDPOINTS = [
  "https://api.devnet.solana.com",
  process.env.NEXT_PUBLIC_HELIUS_RPC_URL || "https://devnet.helius-rpc.com/?api-key=76547270-226d-446d-8293-c1b3f8e8ea1b",
].filter(Boolean);

const MAX_RETRIES_PER_ENDPOINT = 3;
const INITIAL_RETRY_DELAY = 2000; 
const MAX_RETRY_DELAY = 10000; 
const ENDPOINT_SWITCH_DELAY = 1000;

class RateLimitError extends Error {
  constructor(message: string) { super(message); this.name = "RateLimitError"; }
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
const getJitter = (baseDelay: number) => baseDelay * (1 + (Math.random() * 0.2));

const retryInitLogic = async <T,>(
  fn: () => Promise<T>,
  endpoint: string,
  retries = MAX_RETRIES_PER_ENDPOINT,
  delay = INITIAL_RETRY_DELAY
): Promise<T> => {
  try {
    return await fn();
  } catch (error: any) {
    const isRateLimitError = error.message?.includes('429') || error.status === 429 || error.message?.toLowerCase().includes('rate limit');
    if (isRateLimitError) {
      console.warn(`Rate limit detected on ${endpoint}. Switching endpoint.`);
      throw new RateLimitError(`Rate limit hit on ${endpoint}`);
    }
    if (retries === 0) {
      console.error(`Max retries reached on ${endpoint}. Error:`, error);
      throw error;
    }
    const nextDelay = Math.min(delay * 2, MAX_RETRY_DELAY);
    const jitteredDelay = getJitter(nextDelay);
    console.log(`Retrying on ${endpoint} in ${jitteredDelay/1000}s (attempt ${MAX_RETRIES_PER_ENDPOINT - retries + 1}/${MAX_RETRIES_PER_ENDPOINT}). Error: ${error.message}`);
    await sleep(jitteredDelay);
    return retryInitLogic(fn, endpoint, retries - 1, nextDelay);
  }
};

const createConnection = async (rpcEndpoint: string): Promise<Connection> => {
  console.log(`Attempting connection to RPC: ${rpcEndpoint}`);
  const connection = new Connection(rpcEndpoint, 'confirmed' as Commitment);
  await connection.getEpochInfo();
  console.log(`Successfully connected to RPC: ${rpcEndpoint}`);
  return connection;
};

interface StoreWallet {
    publicKey: PublicKey;
    signTransaction: <T extends Transaction | VersionedTransaction>(
        transaction: T
    ) => Promise<T>;
    signAllTransactions: <T extends Transaction | VersionedTransaction>(
        transactions: T[]
    ) => Promise<T[]>;
}

// --- Store State & Actions --- 
interface DriftState {
  isConnected: boolean;
  driftClient: DriftClient | null;
  connection: Connection | null;
  currentRpcEndpoint: string | null;
  isClientLoading: boolean;
  clientError: string | null;
  
  connectedWalletAddress: string | null;
  connectedWalletData: WalletData | null;
  userAccounts: UserAccount[];
  selectedSubAccountId: number;
  isUserDataLoading: boolean;
  userDataError: string | null;

  viewedWalletData: WalletData | null; 
  isViewerLoading: boolean;
  viewerError: string | null;
  
  setWalletConnected: (wallet: StoreWallet) => void; 
  setWalletDisconnected: () => void; 
  initializeDriftClient: (wallet: StoreWallet) => Promise<void>;
  clearDriftClient: () => void;
  fetchConnectedUserData: () => Promise<void>;
  selectSubAccount: (id: number) => void;
  
  fetchDataForWallet: (address: string) => Promise<void>; 
  placeMockOrder: (order: Omit<OpenOrder, 'status'>) => void;
  mockDeposit: (amount: number, symbol: string) => void;
  mockWithdraw: (amount: number, symbol: string) => void;
}

const getMarketSymbolSafe = (marketIndex: number, marketType: MarketType, client: DriftClient): string => {
  try {
    if (marketType === MarketType.SPOT) {
      const market = client.getSpotMarketAccount(marketIndex);
      return market?.name ? String(market.name).replace(/\0/g, '').trim() : `Spot ${marketIndex}`; 
    } else if (marketType === MarketType.PERP) {
      const market = client.getPerpMarketAccount(marketIndex);
      return market?.name ? String(market.name).replace(/\0/g, '').trim() : `Perp ${marketIndex}`; 
    }
  } catch (e) {
    console.warn(`Could not get symbol for market index ${marketIndex}`, e);
  }
  return `Unknown ${marketIndex}`;
}

const processUserAccounts = (userAccounts: UserAccount[], client: DriftClient, walletAddress: string): WalletData => {
    const subAccounts: SubAccountData[] = userAccounts.map(account => {
        const subAccountId = account.subAccountId;
        const balances: TokenBalance[] = [];
        const positions: PerpPosition[] = [];
        const orders: OpenOrder[] = [];

        // Process Balances
        account.spotPositions.forEach(spotPosition => {
            if (!spotPosition.scaledBalance.eq(ZERO) && getVariant(spotPosition.balanceType) === 'Deposit') {
                const spotMarket = client.getSpotMarketAccount(spotPosition.marketIndex);
                if (spotMarket) {
                    const amount = convertToNumber(spotPosition.scaledBalance, spotMarket.decimals);
                    balances.push({
                        symbol: getMarketSymbolSafe(spotPosition.marketIndex, MarketType.SPOT, client),
                        amount: amount,
                        marketIndex: spotPosition.marketIndex, // Ensure included
                    });
                }
            }
        });

        // Process Perp Positions
        account.perpPositions.forEach(perpPosition => {
            if (!perpPosition.baseAssetAmount.eq(ZERO)) {
                 const perpMarket = client.getPerpMarketAccount(perpPosition.marketIndex);
                 if(perpMarket) {
                    const size = convertToNumber(perpPosition.baseAssetAmount.abs(), BASE_PRECISION);
                    const entryPrice = convertToNumber(calculateEntryPrice(perpPosition), PRICE_PRECISION);
                    positions.push({
                        market: getMarketSymbolSafe(perpPosition.marketIndex, MarketType.PERP, client),
                        direction: perpPosition.baseAssetAmount.gt(ZERO) ? 'Long' : 'Short',
                        entryPrice: entryPrice,
                        size: size,
                        marketIndex: perpPosition.marketIndex, // Ensure included
                        pnl: 0, // Assuming pnl is not available in the original data
                    });
                }
            }
        });

        // Process Orders
        account.orders.forEach((order: Order) => { 
            if (getVariant(order.status) === 'Open') {
                const marketSymbol = getMarketSymbolSafe(order.marketIndex, order.marketType, client);
                orders.push({
                    market: marketSymbol,
                    type: getVariant(order.orderType), 
                    direction: getVariant(order.direction), 
                    price: convertToNumber(order.price, PRICE_PRECISION), // Assign price
                    size: convertToNumber(order.baseAssetAmount, BASE_PRECISION),
                    triggerPrice: convertToNumber(order.triggerPrice, PRICE_PRECISION), // Assign triggerPrice
                    status: getVariant(order.status), 
                    marketIndex: order.marketIndex, // Assign marketIndex
                    marketType: getVariant(order.marketType), // Assign marketType
                });
            }
        });

        return {
            id: subAccountId,
            name: `Subaccount ${subAccountId}`,
            balances,
            positions,
            orders,
            userAccount: account,
        };
    });

    return {
        address: walletAddress,
        subAccounts,
    };
};

export const useDriftStore = create<DriftState>((set, get) => ({
  isConnected: false,
  driftClient: null,
  connection: null,
  currentRpcEndpoint: null,
  isClientLoading: false,
  clientError: null,
  connectedWalletAddress: null,
  connectedWalletData: null,
  userAccounts: [],
  selectedSubAccountId: 0, 
  isUserDataLoading: false,
  userDataError: null,
  viewedWalletData: null,
  isViewerLoading: false,
  viewerError: null,

  setWalletConnected: (wallet) => {
    if (get().isConnected && get().connectedWalletAddress === wallet.publicKey.toBase58()) {
      return;
    }
    console.log("Store: Wallet Connected Hook Event", wallet.publicKey.toBase58());
    set({ 
      isConnected: true, 
      connectedWalletAddress: wallet.publicKey.toBase58(),
      connectedWalletData: null,
      selectedSubAccountId: 0, 
      viewedWalletData: null, 
      clientError: null, 
      driftClient: null,
      connection: null,
      userAccounts: [],
      isUserDataLoading: false,
      userDataError: null,
    });
    get().initializeDriftClient(wallet);
  },

  setWalletDisconnected: () => {
    if (!get().isConnected) {
        return;
    }
    console.log("Store: Wallet Disconnected Hook Event");
    get().clearDriftClient();
    set({
      isConnected: false,
      connectedWalletAddress: null,
      connectedWalletData: null,
      selectedSubAccountId: 0,
      viewedWalletData: null,
      clientError: null,
      userAccounts: [],
      isUserDataLoading: false,
      userDataError: null,
    });
  },

  initializeDriftClient: async (wallet) => {
    if (get().driftClient || get().isClientLoading) {
      console.log("DriftClient initialization already in progress or completed.");
      return;
    }
    set({ isClientLoading: true, clientError: null });
    console.log("Attempting DriftClient Initialization...");

    let client: DriftClient | null = null;
    let currentConnection: Connection | null = null;
    let endpoint = "";

    for (let i = 0; i < RPC_ENDPOINTS.length; i++) {
      endpoint = RPC_ENDPOINTS[i];
      set({ currentRpcEndpoint: endpoint });
      console.log(`Attempting init with endpoint ${i + 1}/${RPC_ENDPOINTS.length}: ${endpoint}`);
      try {
        currentConnection = await retryInitLogic(() => createConnection(endpoint), endpoint);
        
        const driftClientConfig = {
          connection: currentConnection,
          wallet: wallet,
          env: 'devnet' as DriftEnv,
          opts: { commitment: 'confirmed' as Commitment, skipPreflight: false }
        };
        
        client = new DriftClient(driftClientConfig);
        if (typeof client.subscribe !== 'function') {
          throw new Error("Client initialization failed - subscribe method missing.")
        }

        console.log(`DriftClient initialized successfully with ${endpoint}`);
        set({ driftClient: client, connection: currentConnection, isClientLoading: false, clientError: null });
        
        await client.subscribe(); 
        console.log("DriftClient subscribed successfully.");
        await get().fetchConnectedUserData(); 
        return;

      } catch (error: any) {
        console.error(`Failed to initialize DriftClient with ${endpoint}:`, error.message);
        client = null;
        currentConnection = null;
        if (error instanceof RateLimitError) {
          console.log("Rate limit hit, trying next endpoint...");
          await sleep(ENDPOINT_SWITCH_DELAY);
        } else if (i < RPC_ENDPOINTS.length - 1) {
          console.log("Error was not rate limit, trying next endpoint anyway...");
          await sleep(ENDPOINT_SWITCH_DELAY);
        } else {
          set({ driftClient: null, connection: null, isClientLoading: false, clientError: `Failed to connect after trying all endpoints. Last error: ${error.message}` });
          toast.error("Failed to initialize Drift Client.");
          return;
        }
      }
    }
  },
  
  clearDriftClient: () => {
    console.log("Clearing DriftClient instance...");
    const client = get().driftClient;
    client?.unsubscribe().catch(e => console.error("Error unsubscribing:", e));
    set({ driftClient: null, connection: null, currentRpcEndpoint: null, clientError: null, isClientLoading: false });
  },

  fetchConnectedUserData: async () => {
    const client = get().driftClient;
    const address = get().connectedWalletAddress;
    if (!client || !address) {
      console.log("Cannot fetch user data: Client or wallet address missing.");
      return set({ isUserDataLoading: false, userDataError: "Client not ready or wallet disconnected."}) ;
    }
    if (get().isUserDataLoading) return;
    
    console.log("Fetching real user data for:", address);
    set({ isUserDataLoading: true, userDataError: null });
    try {
      const publicKey = new PublicKey(address);
      const fetchedUserAccounts = await client.getUserAccountsForAuthority(publicKey);
      console.log("Fetched raw user accounts:", fetchedUserAccounts);
      
      const processedData = processUserAccounts(fetchedUserAccounts || [], client, address); 
      console.log("Processed wallet data:", processedData);

      set({ 
        userAccounts: fetchedUserAccounts || [], 
        connectedWalletData: processedData,      
        isUserDataLoading: false,
        selectedSubAccountId: processedData.subAccounts.some(sub => sub.id === get().selectedSubAccountId) 
                              ? get().selectedSubAccountId 
                              : (processedData.subAccounts[0]?.id ?? 0),
      });
      
    } catch (error: any) {
      console.error("Error fetching user data:", error);
      set({ userAccounts: [], connectedWalletData: null, isUserDataLoading: false, userDataError: error.message });
      toast.error("Failed to fetch account data.");
    }
  },

  selectSubAccount: (id) => set({ selectedSubAccountId: id }),

  fetchDataForWallet: async (address) => {
    set({ isViewerLoading: true, viewerError: null, viewedWalletData: null });
    console.log(`Simulating fetch for wallet: ${address}`);
    await new Promise(resolve => setTimeout(resolve, 1000));
    const data = DUMMY_WALLET_DATA[address] || DUMMY_WALLET_DATA["arbitraryWalletXYZ"];
    set({ viewedWalletData: data, isViewerLoading: false });
    console.log(`Simulated data loaded for: ${address}`);
  },
  placeMockOrder: (order) => set((state) => {
    console.log("Placing mock order:", order);
    if (!state.connectedWalletData) return {};
    
    const updatedSubAccounts = state.connectedWalletData.subAccounts.map(sub => {
      if (sub.id === state.selectedSubAccountId) {
        return {
          ...sub,
          orders: [...sub.orders, { ...order, status: 'Open' } as OpenOrder] 
        };
      }
      return sub;
    });
    
    return {
      connectedWalletData: {
        ...state.connectedWalletData,
        subAccounts: updatedSubAccounts
      }
    };
  }),
  mockDeposit: (amount, symbol) => set((state) => {
    console.log(`Mock deposit: ${amount} ${symbol}`);
    if (!state.connectedWalletData) return {};
    
    const updatedSubAccounts = state.connectedWalletData.subAccounts.map(sub => {
      if (sub.id === state.selectedSubAccountId) {
        const existingBalance = sub.balances.find(b => b.symbol === symbol);
        let newBalances;
        if (existingBalance) {
          newBalances = sub.balances.map(b => 
            b.symbol === symbol ? { ...b, amount: b.amount + amount } : b
          );
        } else {
          newBalances = [...sub.balances, { symbol, amount, marketIndex: 0 }];
        }
        return { ...sub, balances: newBalances };
      }
      return sub;
    });
    
    return {
      connectedWalletData: {
        ...state.connectedWalletData,
        subAccounts: updatedSubAccounts
      }
    };
  }),
  mockWithdraw: (amount, symbol) => set((state) => {
    console.log(`Mock withdraw: ${amount} ${symbol}`);
    if (!state.connectedWalletData) return {};
    
    const updatedSubAccounts = state.connectedWalletData.subAccounts.map(sub => {
      if (sub.id === state.selectedSubAccountId) {
        const newBalances = sub.balances.map(b => 
          b.symbol === symbol ? { ...b, amount: Math.max(0, b.amount - amount) } : b
        ).filter(b => b.amount > 0);
        return { ...sub, balances: newBalances };
      }
      return sub;
    });
    
    return {
      connectedWalletData: {
        ...state.connectedWalletData,
        subAccounts: updatedSubAccounts
      }
    };
  }),
})); 

// Ensure that any variable expected to be a 'number' is checked for 'undefined' and given a default value if necessary
const safeNumber = (value: number | undefined, defaultValue: number = 0): number => value !== undefined ? value : defaultValue;

// Example usage in the code
// const someNumber = safeNumber(pos.pnl); 