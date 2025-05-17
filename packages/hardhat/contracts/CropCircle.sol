// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";


contract CropToken is ERC20, Ownable {
    
    constructor(uint256 initialSupply) ERC20("CROP Token", "CROP") Ownable(msg.sender) {
        _mint(msg.sender, initialSupply);
    }

    
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }
}


contract CropCircle is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;
    
    ///  Initial token amount given to users
    uint256 public constant INITIAL_TOKEN_AMOUNT = 100 * 10**18;
    
    ///  Cost to submit a meme
    uint256 public constant MEME_SUBMISSION_COST = 60 * 10**18;
    
    ///  Cost to cast a vote
    uint256 public constant VOTE_COST = 1 * 10**18;
    
    ///  Total supply for winning meme token
    uint256 public constant WINNING_TOKEN_SUPPLY = 100000 * 10**18;
    
    /// Percentage of tokens allocated to the winner (30%)
    uint256 public constant WINNER_PERCENTAGE = 30;
    
    /// Percentage of tokens allocated to voters (70%)
    uint256 public constant VOTERS_PERCENTAGE = 70;
    
    ///  Address of the CROP token contract
    IERC20 public cropToken;

    ///  Mapping to track users who have already claimed their initial tokens
    mapping(bytes32 => mapping(address => bool)) public hasClaimedTokens;

    
    struct Meme {
        string name;        // Token ticker
        string imageHash;   // IPFS hash
        string description;
        address creator;
        uint256 upvotes;
        uint256 downvotes;
        uint256 timestamp;
        mapping(address => bool) hasVoted;
        mapping(address => int8) voteType; // 1 for up, -1 for down
    }

   
    struct EventInfo {
        uint256 startTime;
        uint256 endTime;
        bytes32 qrCodeHash;
        bool active;
        uint256 memeCount;
        address winningTokenAddress;
        uint256 winningMemeId;
        bool isFinalized;
    }

    // State variables
    
    ///  Mapping from eventId to Event data
    mapping(bytes32 => EventInfo) public events;
    
    /// Mapping from eventId to memeId to Meme data
    mapping(bytes32 => mapping(uint256 => Meme)) public memes;
    
    ///  Mapping from eventId to array of meme IDs
    mapping(bytes32 => uint256[]) public eventMemeIds;
    
    ///  Mapping from eventId to mapping of memeId to array of upvoters
    mapping(bytes32 => mapping(uint256 => address[])) private memeUpvoters;

    // Events

   
    event EventCreated(
        bytes32 indexed eventId,
        uint256 startTime,
        uint256 endTime,
        bytes32 qrCodeHash
    );

    event MemeSubmitted(
        bytes32 indexed eventId,
        uint256 indexed memeId,
        address creator,
        string name,
        string imageHash,
        string description,
        uint256 timestamp
    );

    
    event VoteCast(
        bytes32 indexed eventId,
        uint256 indexed memeId,
        address voter,
        bool isUpvote,
        uint256 timestamp
    );

    event EventEnded(
        bytes32 indexed eventId,
        uint256 winningMemeId,
        address tokenAddress
    );

    /**
     * @notice Emitted when tokens are distributed to a user
     * @param eventId The event ID
     * @param recipient The address of the token recipient
     * @param amount The amount of tokens distributed
     */
    event TokensDistributed(
        bytes32 indexed eventId,
        address recipient,
        uint256 amount
    );

    
    event InitialTokensProvided(
        address indexed user,
        uint256 amount
    );

  
    constructor(address _cropTokenAddress) Ownable(msg.sender) {
        require(_cropTokenAddress != address(0), "Invalid token address");
        cropToken = IERC20(_cropTokenAddress);
    }

   
    function createEvent(uint256 duration) external onlyOwner returns (bytes32 eventId, bytes32 qrCodeHash) {
        require(duration > 0, "Duration must be greater than 0");
        
        uint256 startTime = block.timestamp;
        uint256 endTime = startTime + duration;
        
        // Generate a unique QR code hash internally
        qrCodeHash = keccak256(abi.encodePacked(startTime, endTime, msg.sender, block.number));
        
        // Generate a unique eventId
        eventId = keccak256(abi.encodePacked(startTime, endTime, qrCodeHash, msg.sender));
        
        // Ensure the eventId is not already in use
        require(events[eventId].startTime == 0, "Event ID already exists");
        
        // Create and store the event
        events[eventId] = EventInfo({
            startTime: startTime,
            endTime: endTime,
            qrCodeHash: qrCodeHash,
            active: true,
            memeCount: 0,
            winningTokenAddress: address(0),
            winningMemeId: 0,
            isFinalized: false
        });
        
        emit EventCreated(eventId, startTime, endTime, qrCodeHash);
        
        return (eventId, qrCodeHash);
    }

    
    function provideInitialTokens(bytes32 eventId) external nonReentrant {
        require(events[eventId].active, "Event is not active");
        require(events[eventId].startTime <= block.timestamp, "Event has not started yet");
        require(events[eventId].endTime >= block.timestamp, "Event has already ended");
        require(!hasClaimedTokens[eventId][msg.sender], "Initial tokens already claimed");
        
        // Mark user as having claimed tokens for this event
        hasClaimedTokens[eventId][msg.sender] = true;
        
        // Transfer CROP tokens to the user
        require(cropToken.balanceOf(address(this)) >= INITIAL_TOKEN_AMOUNT, "Insufficient contract balance");
        cropToken.safeTransfer(msg.sender, INITIAL_TOKEN_AMOUNT);
        
        emit InitialTokensProvided(msg.sender, INITIAL_TOKEN_AMOUNT);
    }

 
    function submitMeme(
        bytes32 eventId, 
        string memory name, 
        string memory imageHash, 
        string memory description
    ) external nonReentrant {
        require(events[eventId].active, "Event is not active");
        require(events[eventId].startTime <= block.timestamp, "Event has not started yet");
        require(events[eventId].endTime >= block.timestamp, "Event has already ended");
        require(bytes(name).length > 0, "Name cannot be empty");
        require(bytes(imageHash).length > 0, "Image hash cannot be empty");
        require(bytes(description).length > 0, "Description cannot be empty");
        require(cropToken.balanceOf(msg.sender) >= MEME_SUBMISSION_COST, "Insufficient balance");
        
        // Collect tokens from the sender
        cropToken.safeTransferFrom(msg.sender, address(this), MEME_SUBMISSION_COST);
        
        // Get the next meme ID
        uint256 memeId = events[eventId].memeCount;
        
        // Create and store the meme
        Meme storage newMeme = memes[eventId][memeId];
        newMeme.name = name;
        newMeme.imageHash = imageHash;
        newMeme.description = description;
        newMeme.creator = msg.sender;
        newMeme.timestamp = block.timestamp;
        newMeme.upvotes = 0;
        newMeme.downvotes = 0;
        
        // Add meme ID to the event's meme list
        eventMemeIds[eventId].push(memeId);
        
        // Increment the meme count
        events[eventId].memeCount++;
        
        emit MemeSubmitted(
            eventId,
            memeId,
            msg.sender,
            name,
            imageHash,
            description,
            block.timestamp
        );
    }

    
    function vote(bytes32 eventId, uint256 memeId, bool isUpvote) external nonReentrant {
        require(events[eventId].active, "Event is not active");
        require(events[eventId].startTime <= block.timestamp, "Event has not started yet");
        require(events[eventId].endTime >= block.timestamp, "Event has already ended");
        require(memeId < events[eventId].memeCount, "Invalid meme ID");
        require(!memes[eventId][memeId].hasVoted[msg.sender], "Already voted on this meme");
        require(cropToken.balanceOf(msg.sender) >= VOTE_COST, "Insufficient balance");
        
        // Collect tokens from the sender
        cropToken.safeTransferFrom(msg.sender, address(this), VOTE_COST);
        
        // Update vote counts and mappings
        Meme storage targetMeme = memes[eventId][memeId];
        targetMeme.hasVoted[msg.sender] = true;
        
        if (isUpvote) {
            targetMeme.upvotes += 1;
            targetMeme.voteType[msg.sender] = 1;
            // Track upvoters for token distribution
            memeUpvoters[eventId][memeId].push(msg.sender);
        } else {
            targetMeme.downvotes += 1;
            targetMeme.voteType[msg.sender] = -1;
        }
        
        emit VoteCast(eventId, memeId, msg.sender, isUpvote, block.timestamp);
    }

    function findWinningMeme(bytes32 eventId) internal view returns (uint256) {
        uint256 highestUpvotes = 0;
        uint256 winningId = 0;
        
        for (uint256 i = 0; i < events[eventId].memeCount; i++) {
            if (memes[eventId][i].upvotes > highestUpvotes) {
                highestUpvotes = memes[eventId][i].upvotes;
                winningId = i;
            }
        }
        
        return winningId;
    }

    
    function endEvent(bytes32 eventId) external onlyOwner nonReentrant {
        require(events[eventId].active, "Event is not active");
        require(!events[eventId].isFinalized, "Event already finalized");
        require(events[eventId].memeCount > 0, "No memes submitted");
        
        // Set event as inactive
        events[eventId].active = false;
        events[eventId].isFinalized = true;
        
        // Determine the winning meme (highest upvote count)
        uint256 winningMemeId = findWinningMeme(eventId);
        events[eventId].winningMemeId = winningMemeId;
        
        Meme storage winningMeme = memes[eventId][winningMemeId];
        
        // Deploy the new token
        MemeToken newToken = new MemeToken(winningMeme.name, winningMeme.name);
        address tokenAddress = address(newToken);
        
        // Store token address
        events[eventId].winningTokenAddress = tokenAddress;
        
        // ---- Token Distribution Logic ----
        // Calculate token amounts
        uint256 creatorAmount = (WINNING_TOKEN_SUPPLY * WINNER_PERCENTAGE) / 100;
        uint256 votersAmount = WINNING_TOKEN_SUPPLY - creatorAmount;
        
        // Distribute to creator
        newToken.transfer(winningMeme.creator, creatorAmount);
        emit TokensDistributed(eventId, winningMeme.creator, creatorAmount);
        
        // Distribute to upvoters
        address[] storage upvoters = memeUpvoters[eventId][winningMemeId];
        uint256 upvoteCount = upvoters.length;
        
        if (upvoteCount > 0) {
            uint256 tokenPerUpvoter = votersAmount / upvoteCount;
            
            for (uint256 i = 0; i < upvoteCount; i++) {
                address upvoter = upvoters[i];
                newToken.transfer(upvoter, tokenPerUpvoter);
                emit TokensDistributed(eventId, upvoter, tokenPerUpvoter);
            }
            
            // If there's any remainder due to division, send it to the creator
            uint256 remainder = votersAmount - (tokenPerUpvoter * upvoteCount);
            if (remainder > 0) {
                newToken.transfer(winningMeme.creator, remainder);
                emit TokensDistributed(eventId, winningMeme.creator, remainder);
            }
        } else {
            // If no upvoters, give all remaining tokens to creator
            newToken.transfer(winningMeme.creator, votersAmount);
            emit TokensDistributed(eventId, winningMeme.creator, votersAmount);
        }
        
        emit EventEnded(eventId, winningMemeId, tokenAddress);
    }

    
    function refillTokens(uint256 amount) external {
        cropToken.safeTransferFrom(msg.sender, address(this), amount);
    }


    function getEventDetails(bytes32 eventId) external view returns (
        uint256 startTime,
        uint256 endTime,
        bytes32 qrCodeHash,
        bool active,
        uint256 memeCount,
        address winningTokenAddress,
        uint256 winningMemeId,
        bool isFinalized
    ) {
        EventInfo storage eventInfo = events[eventId];
        return (
            eventInfo.startTime,
            eventInfo.endTime,
            eventInfo.qrCodeHash,
            eventInfo.active,
            eventInfo.memeCount,
            eventInfo.winningTokenAddress,
            eventInfo.winningMemeId,
            eventInfo.isFinalized
        );
    }

    
    function getMemeDetails(bytes32 eventId, uint256 memeId) external view returns (
        string memory name,
        string memory imageHash,
        string memory description,
        address creator,
        uint256 upvotes,
        uint256 downvotes,
        uint256 timestamp
    ) {
        require(memeId < events[eventId].memeCount, "Invalid meme ID");
        
        Meme storage meme = memes[eventId][memeId];
        return (
            meme.name,
            meme.imageHash,
            meme.description,
            meme.creator,
            meme.upvotes,
            meme.downvotes,
            meme.timestamp
        );
    }

    
    function getEventMemeIds(bytes32 eventId) external view returns (uint256[] memory) {
        return eventMemeIds[eventId];
    }

    
    function getUserVote(bytes32 eventId, uint256 memeId, address user) external view returns (bool hasVoted, int8 voteType) {
        require(memeId < events[eventId].memeCount, "Invalid meme ID");
        
        Meme storage meme = memes[eventId][memeId];
        return (meme.hasVoted[user], meme.voteType[user]);
    }

   
    function getMemeScore(bytes32 eventId, uint256 memeId) external view returns (int256) {
        require(memeId < events[eventId].memeCount, "Invalid meme ID");
        
        Meme storage meme = memes[eventId][memeId];
        return int256(meme.upvotes) - int256(meme.downvotes);
    }

   
    function getMemeUpvoters(bytes32 eventId, uint256 memeId) external view returns (address[] memory) {
        require(memeId < events[eventId].memeCount, "Invalid meme ID");
        return memeUpvoters[eventId][memeId];
    }

    
    function hasUserClaimedTokens(bytes32 eventId, address user) external view returns (bool) {
        return hasClaimedTokens[eventId][user];
    }

    function getContractTokenBalance() external view returns (uint256) {
        return cropToken.balanceOf(address(this));
    }
}


contract MemeToken is ERC20 {
    
    constructor(string memory name, string memory symbol) ERC20(name, symbol) {
        _mint(msg.sender, 100000 * 10**decimals());
    }
}
