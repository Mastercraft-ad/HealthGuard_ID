// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./HealthGuardXUsers.sol";

/**
 * @title HealthGuardX Insurance Contract
 * @dev Insurance policies and claims management
 */
contract HealthGuardXInsurance {
    HealthGuardXUsers public usersContract;
    
    struct InsurancePolicy {
        string policyId;
        address patient;
        address provider;
        uint256 premiumAmount;
        uint256 coverageAmount;
        uint256 startDate;
        uint256 endDate;
        PolicyStatus status;
    }
    
    struct Claim {
        string claimId;
        address patient;
        address hospital;
        address provider;
        string policyId;
        uint256 claimAmount;
        uint256 approvedAmount;
        string invoiceCID;
        ClaimStatus status;
        uint256 submittedAt;
        uint256 reviewedAt;
    }
    
    enum PolicyStatus { Active, Expired, Cancelled }
    enum ClaimStatus { Pending, Approved, Rejected, Paid }
    
    mapping(string => InsurancePolicy) public policies;
    mapping(address => string[]) public userPolicies;
    mapping(string => Claim) public claims;
    
    string[] public allClaimIds;
    
    event PolicyCreated(string indexed policyId, address indexed patient, address indexed provider, uint256 premiumAmount);
    event PremiumPaid(string indexed policyId, address indexed patient, uint256 amount, uint256 timestamp);
    event ClaimSubmitted(string indexed claimId, address indexed patient, address indexed hospital, uint256 amount);
    event ClaimReviewed(string indexed claimId, ClaimStatus status, uint256 approvedAmount, uint256 timestamp);
    
    modifier onlyVerified() {
        HealthGuardXUsers.User memory user = usersContract.getUser(msg.sender);
        require(user.status == HealthGuardXUsers.Status.Verified, "Not verified");
        _;
    }
    
    modifier onlyRole(HealthGuardXUsers.Role _role) {
        HealthGuardXUsers.User memory user = usersContract.getUser(msg.sender);
        require(user.role == _role, "Unauthorized role");
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
    
    function createInsurancePolicy(
        string memory _policyId,
        address _patient,
        uint256 _premiumAmount,
        uint256 _coverageAmount,
        uint256 _duration
    ) external onlyVerified onlyRole(HealthGuardXUsers.Role.InsuranceProvider) userExists(_patient) {
        policies[_policyId] = InsurancePolicy({
            policyId: _policyId,
            patient: _patient,
            provider: msg.sender,
            premiumAmount: _premiumAmount,
            coverageAmount: _coverageAmount,
            startDate: block.timestamp,
            endDate: block.timestamp + _duration,
            status: PolicyStatus.Active
        });
        
        userPolicies[_patient].push(_policyId);
        emit PolicyCreated(_policyId, _patient, msg.sender, _premiumAmount);
    }
    
    function payPremium(string memory _policyId) external payable userExists(msg.sender) {
        InsurancePolicy storage policy = policies[_policyId];
        require(policy.patient == msg.sender, "Not policy holder");
        require(policy.status == PolicyStatus.Active, "Policy not active");
        require(msg.value >= policy.premiumAmount, "Insufficient payment");
        
        (bool success, ) = policy.provider.call{value: msg.value}("");
        require(success, "Payment failed");
        
        emit PremiumPaid(_policyId, msg.sender, msg.value, block.timestamp);
    }
    
    function submitClaim(
        string memory _claimId,
        string memory _policyId,
        uint256 _amount,
        string memory _invoiceCID
    ) external onlyVerified onlyRole(HealthGuardXUsers.Role.Hospital) {
        InsurancePolicy memory policy = policies[_policyId];
        require(policy.status == PolicyStatus.Active, "Policy not active");
        
        claims[_claimId] = Claim({
            claimId: _claimId,
            patient: policy.patient,
            hospital: msg.sender,
            provider: policy.provider,
            policyId: _policyId,
            claimAmount: _amount,
            approvedAmount: 0,
            invoiceCID: _invoiceCID,
            status: ClaimStatus.Pending,
            submittedAt: block.timestamp,
            reviewedAt: 0
        });
        
        allClaimIds.push(_claimId);
        emit ClaimSubmitted(_claimId, policy.patient, msg.sender, _amount);
    }
    
    function reviewClaim(
        string memory _claimId,
        ClaimStatus _status,
        uint256 _approvedAmount
    ) external onlyVerified onlyRole(HealthGuardXUsers.Role.InsuranceProvider) {
        Claim storage claim = claims[_claimId];
        require(claim.provider == msg.sender, "Not claim provider");
        require(claim.status == ClaimStatus.Pending, "Invalid status");
        
        claim.status = _status;
        claim.approvedAmount = _approvedAmount;
        claim.reviewedAt = block.timestamp;
        
        emit ClaimReviewed(_claimId, _status, _approvedAmount, block.timestamp);
    }
    
    function payClaim(string memory _claimId) external onlyVerified onlyRole(HealthGuardXUsers.Role.InsuranceProvider) {
        Claim storage claim = claims[_claimId];
        require(claim.provider == msg.sender, "Not claim provider");
        require(claim.status == ClaimStatus.Approved, "Claim not approved");
        
        uint256 platformFee = (claim.approvedAmount * 2) / 100; // 2% platform fee
        uint256 hospitalAmount = claim.approvedAmount - platformFee;
        
        // Transfer funds
        (bool success, ) = claim.hospital.call{value: hospitalAmount}("");
        require(success, "Payment failed");
        
        claim.status = ClaimStatus.Paid;
    }
    
    function getUserPolicies(address _user) external view returns (string[] memory) {
        return userPolicies[_user];
    }
    
    function getPolicy(string memory _policyId) external view returns (InsurancePolicy memory) {
        return policies[_policyId];
    }
    
    function getClaim(string memory _claimId) external view returns (Claim memory) {
        return claims[_claimId];
    }
    
    function getTotalClaims() external view returns (uint256) {
        return allClaimIds.length;
    }
}
