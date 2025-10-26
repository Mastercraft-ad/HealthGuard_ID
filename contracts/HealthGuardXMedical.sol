// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./HealthGuardXUsers.sol";

/**
 * @title HealthGuardX Medical Records Contract
 * @dev Medical records and access control
 */
contract HealthGuardXMedical {
    HealthGuardXUsers public usersContract;
    
    struct MedicalRecord {
        string recordId;
        string encryptedCID;
        string recordType;
        address uploadedBy;
        uint256 uploadedAt;
        bool isEmergency;
    }
    
    struct AccessGrant {
        address patient;
        address requester;
        uint256 grantedAt;
        uint256 expiresAt;
        bool isActive;
    }
    
    mapping(string => MedicalRecord) public medicalRecords;
    mapping(address => string[]) public userRecordIds;
    mapping(address => mapping(address => AccessGrant)) public accessGrants;
    
    event RecordAdded(string indexed recordId, address indexed patient, uint256 timestamp);
    event AccessGranted(address indexed patient, address indexed requester, uint256 expiresAt);
    event AccessRevoked(address indexed patient, address indexed requester, uint256 timestamp);
    
    modifier onlyVerified() {
        HealthGuardXUsers.User memory user = usersContract.getUser(msg.sender);
        require(user.status == HealthGuardXUsers.Status.Verified, "Not verified");
        _;
    }
    
    modifier userExists(address _user) {
        HealthGuardXUsers.User memory user = usersContract.getUser(_user);
        require(user.exists, "User does not exist");
        _;
    }
    
    constructor(address _usersAddress) {
        usersContract = HealthGuardXUsers(_usersAddress);
    }
    
    function addMedicalRecord(
        string memory _recordId,
        string memory _encryptedCID,
        string memory _recordType,
        bool _isEmergency
    ) external onlyVerified {
        medicalRecords[_recordId] = MedicalRecord({
            recordId: _recordId,
            encryptedCID: _encryptedCID,
            recordType: _recordType,
            uploadedBy: msg.sender,
            uploadedAt: block.timestamp,
            isEmergency: _isEmergency
        });
        
        userRecordIds[msg.sender].push(_recordId);
        emit RecordAdded(_recordId, msg.sender, block.timestamp);
    }
    
    function grantAccess(
        address _requester,
        uint256 _duration
    ) external userExists(msg.sender) userExists(_requester) {
        accessGrants[msg.sender][_requester] = AccessGrant({
            patient: msg.sender,
            requester: _requester,
            grantedAt: block.timestamp,
            expiresAt: block.timestamp + _duration,
            isActive: true
        });
        
        emit AccessGranted(msg.sender, _requester, block.timestamp + _duration);
    }
    
    function revokeAccess(address _requester) external {
        require(accessGrants[msg.sender][_requester].isActive, "No active access");
        accessGrants[msg.sender][_requester].isActive = false;
        emit AccessRevoked(msg.sender, _requester, block.timestamp);
    }
    
    function getUserRecords(address _user) external view returns (string[] memory) {
        return userRecordIds[_user];
    }
    
    function getMedicalRecord(string memory _recordId) external view returns (MedicalRecord memory) {
        return medicalRecords[_recordId];
    }
    
    function hasAccess(address _patient, address _requester) public view returns (bool) {
        AccessGrant memory grant = accessGrants[_patient][_requester];
        return grant.isActive && grant.expiresAt > block.timestamp;
    }
}
