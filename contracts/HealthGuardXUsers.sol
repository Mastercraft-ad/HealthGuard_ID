// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title HealthGuardX Users Contract
 * @dev Core user management, roles, and KYC
 */
contract HealthGuardXUsers {
    address public admin;
    address public platformTreasury;
    
    struct User {
        string uid;
        address walletAddress;
        string username;
        Role role;
        Status status;
        uint256 registeredAt;
        uint256 lastActiveAt;
        bool exists;
    }
    
    struct KYCDocument {
        string documentCID;
        string documentType;
        string documentHash;
        Status verificationStatus;
        uint256 submittedAt;
        uint256 verifiedAt;
        string rejectionReason;
    }
    
    enum Role { Patient, Doctor, Hospital, InsuranceProvider, Admin }
    enum Status { Pending, Verified, Rejected }
    
    mapping(address => User) public users;
    mapping(string => address) public uidToAddress;
    mapping(address => KYCDocument) public kycDocuments;
    mapping(address => bool) public roleApplications;
    
    address[] public allUsers;
    string[] public pendingKYC;
    
    event UserRegistered(address indexed user, string uid, Role role, uint256 timestamp);
    event KYCSubmitted(address indexed user, string documentCID, uint256 timestamp);
    event KYCVerified(address indexed user, address indexed verifiedBy, uint256 timestamp);
    
    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin");
        _;
    }
    
    modifier onlyVerified() {
        require(users[msg.sender].status == Status.Verified, "Not verified");
        _;
    }
    
    modifier userExists(address _user) {
        require(users[_user].exists, "User does not exist");
        _;
    }
    
    constructor(address _treasury) {
        admin = msg.sender;
        platformTreasury = _treasury != address(0) ? _treasury : msg.sender;
        
        _createAdminUser();
    }
    
    function _createAdminUser() private {
        users[admin] = User({
            uid: "HID100000001",
            walletAddress: admin,
            username: "admin",
            role: Role.Admin,
            status: Status.Verified,
            registeredAt: block.timestamp,
            lastActiveAt: block.timestamp,
            exists: true
        });
        
        uidToAddress["HID100000001"] = admin;
        allUsers.push(admin);
        
        emit UserRegistered(admin, "HID100000001", Role.Admin, block.timestamp);
    }
    
    function registerUser(string memory _uid, string memory _username) external {
        require(!users[msg.sender].exists, "User already registered");
        require(uidToAddress[_uid] == address(0), "UID already taken");
        
        users[msg.sender] = User({
            uid: _uid,
            walletAddress: msg.sender,
            username: _username,
            role: Role.Patient,
            status: Status.Pending,
            registeredAt: block.timestamp,
            lastActiveAt: block.timestamp,
            exists: true
        });
        
        uidToAddress[_uid] = msg.sender;
        allUsers.push(msg.sender);
        
        emit UserRegistered(msg.sender, _uid, Role.Patient, block.timestamp);
    }
    
    function submitKYC(
        string memory _documentCID,
        string memory _documentType,
        string memory _documentHash
    ) external userExists(msg.sender) {
        kycDocuments[msg.sender] = KYCDocument({
            documentCID: _documentCID,
            documentType: _documentType,
            documentHash: _documentHash,
            verificationStatus: Status.Pending,
            submittedAt: block.timestamp,
            verifiedAt: 0,
            rejectionReason: ""
        });
        
        pendingKYC.push(users[msg.sender].uid);
        emit KYCSubmitted(msg.sender, _documentCID, block.timestamp);
    }
    
    function verifyKYC(address _user) external onlyAdmin userExists(_user) {
        kycDocuments[_user].verificationStatus = Status.Verified;
        kycDocuments[_user].verifiedAt = block.timestamp;
        users[_user].status = Status.Verified;
        
        emit KYCVerified(_user, msg.sender, block.timestamp);
    }
    
    function applyForRole(Role _role) external onlyVerified {
        require(_role != Role.Admin && _role != Role.Patient, "Invalid role");
        roleApplications[msg.sender] = true;
    }
    
    function approveRole(address _user, Role _role) external onlyAdmin userExists(_user) {
        require(roleApplications[_user], "No pending application");
        users[_user].role = _role;
        roleApplications[_user] = false;
    }
    
    function updatePlatformTreasury(address _newTreasury) external onlyAdmin {
        require(_newTreasury != address(0), "Invalid address");
        platformTreasury = _newTreasury;
    }
    
    function getUser(address _user) external view returns (User memory) {
        return users[_user];
    }
    
    function getTotalUsers() external view returns (uint256) {
        return allUsers.length;
    }
}
