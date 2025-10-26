// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./HealthGuardXUsers.sol";

/**
 * @title HealthGuardX Payments Contract
 * @dev Payments, subscriptions, and fund management
 */
contract HealthGuardXPayments {
    HealthGuardXUsers public usersContract;
    
    uint256 public constant HOSPITAL_SUBSCRIPTION = 10000 * 10**18;
    uint256 public constant INSURANCE_SUBSCRIPTION = 15000 * 10**18;
    uint256 public constant PLATFORM_FEE_PERCENTAGE = 2;
    
    struct Invoice {
        string invoiceId;
        address hospital;
        address patient;
        uint256 amount;
        InvoiceStatus status;
        uint256 createdAt;
        uint256 paidAt;
    }
    
    struct Subscription {
        address entity;
        uint256 startDate;
        uint256 endDate;
        uint256 amount;
        bool isActive;
    }
    
    enum InvoiceStatus { Pending, Paid }
    enum SubscriptionType { Hospital, Insurance }
    
    mapping(string => Invoice) public invoices;
    mapping(address => Subscription) public subscriptions;
    mapping(address => uint256) public balances;
    
    event InvoiceCreated(string indexed invoiceId, address indexed hospital, address indexed patient, uint256 amount);
    event InvoicePaid(string indexed invoiceId, address indexed patient, uint256 amount, uint256 timestamp);
    event SubscriptionPaid(address indexed entity, SubscriptionType subscriptionType, uint256 amount, uint256 endDate);
    event FundsDeposited(address indexed user, uint256 amount, uint256 timestamp);
    event FundsWithdrawn(address indexed user, uint256 amount, uint256 timestamp);
    
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
    
    modifier hasActiveSubscription() {
        require(
            subscriptions[msg.sender].isActive && 
            subscriptions[msg.sender].endDate > block.timestamp,
            "No active subscription"
        );
        _;
    }
    
    constructor(address _usersAddress) {
        usersContract = HealthGuardXUsers(_usersAddress);
    }
    
    function createInvoice(
        string memory _invoiceId,
        address _patient,
        uint256 _amount
    ) external onlyVerified onlyRole(HealthGuardXUsers.Role.Hospital) hasActiveSubscription userExists(_patient) {
        invoices[_invoiceId] = Invoice({
            invoiceId: _invoiceId,
            hospital: msg.sender,
            patient: _patient,
            amount: _amount,
            status: InvoiceStatus.Pending,
            createdAt: block.timestamp,
            paidAt: 0
        });
        
        emit InvoiceCreated(_invoiceId, msg.sender, _patient, _amount);
    }
    
    function payInvoice(string memory _invoiceId) external payable {
        Invoice storage invoice = invoices[_invoiceId];
        require(invoice.patient == msg.sender, "Not invoice recipient");
        require(invoice.status == InvoiceStatus.Pending, "Invoice already processed");
        require(msg.value >= invoice.amount, "Insufficient payment");
        
        uint256 platformFee = (invoice.amount * PLATFORM_FEE_PERCENTAGE) / 100;
        uint256 hospitalAmount = invoice.amount - platformFee;
        
        // Transfer funds
        (bool success, ) = invoice.hospital.call{value: hospitalAmount}("");
        require(success, "Payment failed");
        
        invoice.status = InvoiceStatus.Paid;
        invoice.paidAt = block.timestamp;
        
        emit InvoicePaid(_invoiceId, msg.sender, invoice.amount, block.timestamp);
    }
    
    function paySubscription(SubscriptionType _type) external payable onlyVerified {
        uint256 requiredAmount = _type == SubscriptionType.Hospital ? 
            HOSPITAL_SUBSCRIPTION : INSURANCE_SUBSCRIPTION;
        
        require(msg.value >= requiredAmount, "Insufficient payment");
        require(
            usersContract.getUser(msg.sender).role == HealthGuardXUsers.Role.Hospital || 
            usersContract.getUser(msg.sender).role == HealthGuardXUsers.Role.InsuranceProvider,
            "Invalid role for subscription"
        );
        
        subscriptions[msg.sender] = Subscription({
            entity: msg.sender,
            startDate: block.timestamp,
            endDate: block.timestamp + 365 days,
            amount: msg.value,
            isActive: true
        });
        
        emit SubscriptionPaid(msg.sender, _type, msg.value, block.timestamp + 365 days);
    }
    
    function deposit() external payable {
        require(msg.value > 0, "Must deposit something");
        balances[msg.sender] += msg.value;
        emit FundsDeposited(msg.sender, msg.value, block.timestamp);
    }
    
    function withdraw(uint256 _amount) external {
        require(balances[msg.sender] >= _amount, "Insufficient balance");
        balances[msg.sender] -= _amount;
        payable(msg.sender).transfer(_amount);
        emit FundsWithdrawn(msg.sender, _amount, block.timestamp);
    }
    
    function getInvoice(string memory _invoiceId) external view returns (Invoice memory) {
        return invoices[_invoiceId];
    }
    
    function getSubscription(address _entity) external view returns (Subscription memory) {
        return subscriptions[_entity];
    }
    
    function getBalance(address _user) external view returns (uint256) {
        return balances[_user];
    }
    
    receive() external payable {
        balances[msg.sender] += msg.value;
        emit FundsDeposited(msg.sender, msg.value, block.timestamp);
    }
}
