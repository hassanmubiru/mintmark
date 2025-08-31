declare module 'ethers' {
  export class Contract {
    constructor(address: string, abi: any[], provider?: any);
  }

  export class Interface {
    constructor(abi: any[]);
    parseLog(log: any): any;
  }
}
