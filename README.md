# MintMark - Proof-of-Attendance NFT Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Base Network](https://img.shields.io/badge/Network-Base-blue.svg)](https://base.org/)
[![Solidity](https://img.shields.io/badge/Solidity-0.8.19-blue.svg)](https://soliditylang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-14.0-black.svg)](https://nextjs.org/)

MintMark is a fully on-chain decentralized application that issues unique ERC-721 NFT badges to users who attend events or complete verified tasks. Built on the Base network with a comprehensive role-based access control system.

## 🌟 Features

- **🎫 Proof-of-Attendance NFTs**: Unique ERC-721 badges for event attendance
- **🔐 Role-Based Access Control**: Admin, Organizer, and Verifier roles
- **✅ Multiple Verification Methods**: QR codes, digital signatures, and manual verification
- **🎖️ Badge Rarity System**: Common to Legendary badges based on attendance patterns
- **📈 Streak Tracking**: Monitor consecutive event attendance
- **🌐 IPFS Integration**: Decentralized metadata and image storage
- **⚡ Base Network**: Fast and low-cost transactions
- **🎨 Modern UI**: Beautiful Next.js frontend with Tailwind CSS

## 📁 Project Structure

```
mintmark/
├── contracts/                  # Solidity smart contracts
│   ├── EventManager.sol       # Event creation and management
│   ├── Attendance.sol          # Attendance verification logic
│   ├── BadgeNFT.sol           # ERC-721 NFT implementation
│   └── AccessControl.sol       # Role-based permissions
├── scripts/                    # Deployment & utility scripts
│   ├── deploy.js              # Main deployment script
│   ├── verify.js              # Contract verification
│   └── seedEvents.js          # Sample data creation
├── test/                       # Comprehensive test suite
│   ├── AccessControl.test.js
│   ├── EventManager.test.js
│   ├── Attendance.test.js
│   └── helpers/
├── pages/                      # Next.js pages
│   ├── index.tsx              # Landing page
│   ├── dashboard.tsx          # User badge gallery
│   ├── organizer.tsx          # Event management
│   └── admin.tsx              # System administration
├── components/                 # React components
│   ├── EventCard.tsx
│   ├── BadgeGallery.tsx
│   ├── AttendanceForm.tsx
│   └── RoleGate.tsx
├── hooks/                      # Custom React hooks
├── utils/                      # Utility functions
└── metadata/                   # IPFS templates
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Git
- MetaMask or compatible Web3 wallet

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/mintmark.git
   cd mintmark
   ```

2. **Install dependencies**
   ```bash
   npm install --legacy-peer-deps
   ```

3. **Environment setup**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` with your configuration:
   ```env
   # Deployment
   PRIVATE_KEY=your_private_key_without_0x
   BASESCAN_API_KEY=your_basescan_api_key
   
   # Network RPCs
   BASE_GOERLI_RPC_URL=https://goerli.base.org
   BASE_MAINNET_RPC_URL=https://mainnet.base.org
   
   # IPFS (Infura or Pinata)
   IPFS_PROJECT_ID=your_ipfs_project_id
   IPFS_PROJECT_SECRET=your_ipfs_secret
   
   # Frontend
   NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id
   ```

4. **Compile contracts**
   ```bash
   npm run compile
   ```

5. **Run tests**
   ```bash
   npm test
   ```

## 📋 Smart Contract Deployment

### Local Development

1. **Start local node**
   ```bash
   npx hardhat node
   ```

2. **Deploy to local network**
   ```bash
   npx hardhat run scripts/deploy.js --network localhost
   ```

### Base Testnet (Goerli)

1. **Get testnet ETH** from [Base Goerli Faucet](https://www.coinbase.com/faucets/base-ethereum-goerli-faucet)

2. **Deploy contracts**
   ```bash
   npm run deploy:base-goerli
   ```

3. **Verify contracts**
   ```bash
   npm run verify
   ```

4. **Seed sample data**
   ```bash
   npx hardhat run scripts/seedEvents.js --network base-goerli
   ```

### Base Mainnet

1. **Deploy to mainnet**
   ```bash
   npm run deploy:base
   ```

2. **Verify contracts**
   ```bash
   npm run verify
   ```

## 💻 Frontend Development

### Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

### Production Build

```bash
npm run build
npm start
```

### Environment Variables for Frontend

After deployment, update your `.env` with contract addresses:

```env
NEXT_PUBLIC_ACCESS_CONTROL_ADDRESS=0x...
NEXT_PUBLIC_EVENT_MANAGER_ADDRESS=0x...
NEXT_PUBLIC_BADGE_NFT_ADDRESS=0x...
NEXT_PUBLIC_ATTENDANCE_ADDRESS=0x...
NEXT_PUBLIC_CHAIN_ID=84531
```

## 🔧 Contract Architecture

### AccessControl.sol
- Manages role-based permissions
- Roles: Admin, Organizer, Verifier
- Hierarchical access control

### EventManager.sol
- Event creation and lifecycle management
- Capacity tracking and validation
- Organizer-specific event queries

### BadgeNFT.sol
- ERC-721 implementation for attendance badges
- Rarity system and streak tracking
- Metadata management with IPFS

### Attendance.sol
- Multiple verification methods
- QR code generation and validation
- Attendance record management

## 🎯 Usage Guide

### For Event Organizers

1. **Connect Wallet** and ensure you have the Organizer role
2. **Create Event** with details and capacity limits
3. **Generate QR Code** for easy attendee verification
4. **Verify Attendance** manually or via QR codes
5. **Monitor Analytics** and manage event lifecycle

### For Attendees

1. **Connect Wallet** to the dApp
2. **Browse Events** and find interesting ones
3. **Verify Attendance** using QR code or provided method
4. **Collect NFT Badge** automatically upon verification
5. **View Collection** in your personal dashboard

### For Administrators

1. **Manage Roles** - Grant/revoke Organizer and Verifier roles
2. **Monitor System** - View platform-wide statistics
3. **Handle Issues** - Revoke badges or deactivate events
4. **System Health** - Monitor contract status and performance

## 🧪 Testing

### Run All Tests
```bash
npm test
```

### Run Specific Test Suites
```bash
npx hardhat test test/AccessControl.test.js
npx hardhat test test/EventManager.test.js
npx hardhat test test/Attendance.test.js
```

### Test Coverage
```bash
npx hardhat coverage
```

### Gas Reports
```bash
REPORT_GAS=true npm test
```

## 🌐 Network Configuration

### Supported Networks

| Network | Chain ID | RPC URL |
|---------|----------|---------|
| Base Goerli | 84531 | https://goerli.base.org |
| Base Mainnet | 8453 | https://mainnet.base.org |
| Base Sepolia | 84532 | https://sepolia.base.org |

### Adding Networks to MetaMask

**Base Goerli Testnet:**
- Network Name: Base Goerli
- RPC URL: https://goerli.base.org
- Chain ID: 84531
- Currency Symbol: ETH
- Block Explorer: https://goerli.basescan.org

## 📊 Contract Interactions

### Event Creation
```javascript
const tx = await eventManager.createEvent(
  "My Event",
  "Event description",
  "ipfs://metadata-uri",
  startTimestamp,
  endTimestamp,
  maxAttendees,
  "Location",
  "Category"
);
```

### Attendance Verification
```javascript
// QR Code verification
await attendance.verifyAttendanceByQR(
  eventId,
  qrSecret,
  metadataURI
);

// Manual verification
await attendance.verifyAttendanceManually(
  attendeeAddress,
  eventId,
  notes,
  metadataURI
);
```

### Badge Queries
```javascript
// Get user badges
const badges = await badgeNFT.getUserBadges(userAddress);

// Get user stats
const stats = await badgeNFT.getUserStats(userAddress);
```

## 🔐 Security Considerations

- **Role-based access control** prevents unauthorized actions
- **Reentrancy protection** on critical functions
- **Pausable contracts** for emergency situations
- **Input validation** on all user-provided data
- **Metadata integrity** through IPFS content addressing

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Development Guidelines

- Follow Solidity best practices
- Write comprehensive tests for new features
- Update documentation for API changes
- Use conventional commit messages
- Ensure gas efficiency in contract code

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [OpenZeppelin](https://openzeppelin.com/) for secure contract libraries
- [Base](https://base.org/) for the L2 infrastructure
- [Next.js](https://nextjs.org/) for the frontend framework
- [RainbowKit](https://www.rainbowkit.com/) for wallet connectivity

## 📧 Support

- GitHub Issues: [Create an issue](https://github.com/your-username/mintmark/issues)
- Documentation: [docs.mintmark.app](https://docs.mintmark.app)
- Discord: [Join our community](https://discord.gg/mintmark)

## 🗺️ Roadmap

- [ ] Mobile app development
- [ ] Multi-chain support
- [ ] Advanced analytics dashboard
- [ ] Badge marketplace
- [ ] Event streaming integration
- [ ] NFT utility features

---

Built with ❤️ for the Web3 community. Happy minting! 🎉
