export interface UserBalance {
    symbol: string;
    balanceRaw: BigInt;
    balanceDecimals: number;
}


export interface User {
    id: string;
    email: string;
    username: string;
}

