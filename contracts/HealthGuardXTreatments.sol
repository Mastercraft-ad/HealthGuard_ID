// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./HealthGuardXUsers.sol";

/**
 * @title HealthGuardX Treatments Contract
 * @dev Treatments, consultations, and doctor-patient interactions
 */
contract HealthGuardXTreatments {
    HealthGuardXUsers public usersContract;
    
    uint256 public constant PLATFORM_FEE_PERCENTAGE = 2;
    
    struct Treatment {
        string treatmentId;
        address doctor;
        address patient;
        string diagnosis;
        string prescription;
        uint256 timestamp;
        uint256 fee;
        bool isPaid;
    }
    
    struct Consultation {
        string consultationId;
        address doctor;
        address patient;
        uint256 fee;
        string notes;
        uint256 scheduledAt;
        uint256 completedAt;
        bool isPaid;
    }
    
    mapping(string => Treatment) public treatments;
    mapping(string => Consultation) public consultations;
    
    event TreatmentLogged(string indexed treatmentId, address indexed doctor, address indexed patient, uint256 fee);
    event ConsultationScheduled(string indexed consultationId, address indexed doctor, address indexed patient, uint256 fee);
    event ConsultationCompleted(string indexed consultationId, uint256 timestamp);
    
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
    
    function logTreatment(
        string memory _treatmentId,
        address _patient,
        string memory _diagnosis,
        string memory _prescription,
        uint256 _fee
    ) external onlyVerified onlyRole(HealthGuardXUsers.Role.Doctor) userExists(_patient) {
        treatments[_treatmentId] = Treatment({
            treatmentId: _treatmentId,
            doctor: msg.sender,
            patient: _patient,
            diagnosis: _diagnosis,
            prescription: _prescription,
            timestamp: block.timestamp,
            fee: _fee,
            isPaid: false
        });
        
        emit TreatmentLogged(_treatmentId, msg.sender, _patient, _fee);
    }
    
    function scheduleConsultation(
        string memory _consultationId,
        address _patient,
        uint256 _fee,
        uint256 _scheduledTime
    ) external onlyVerified onlyRole(HealthGuardXUsers.Role.Doctor) userExists(_patient) {
        consultations[_consultationId] = Consultation({
            consultationId: _consultationId,
            doctor: msg.sender,
            patient: _patient,
            fee: _fee,
            notes: "",
            scheduledAt: _scheduledTime,
            completedAt: 0,
            isPaid: false
        });
        
        emit ConsultationScheduled(_consultationId, msg.sender, _patient, _fee);
    }
    
    function completeConsultation(
        string memory _consultationId,
        string memory _notes
    ) external onlyVerified onlyRole(HealthGuardXUsers.Role.Doctor) {
        Consultation storage consultation = consultations[_consultationId];
        require(consultation.doctor == msg.sender, "Not consultation doctor");
        consultation.completedAt = block.timestamp;
        consultation.notes = _notes;
        
        emit ConsultationCompleted(_consultationId, block.timestamp);
    }
    
    function payTreatment(string memory _treatmentId) external payable {
        Treatment storage treatment = treatments[_treatmentId];
        require(treatment.patient == msg.sender, "Not treatment patient");
        require(!treatment.isPaid, "Already paid");
        require(msg.value >= treatment.fee, "Insufficient payment");
        
        uint256 platformFee = (treatment.fee * PLATFORM_FEE_PERCENTAGE) / 100;
        uint256 doctorAmount = treatment.fee - platformFee;
        
        // Transfer funds
        (bool success, ) = treatment.doctor.call{value: doctorAmount}("");
        require(success, "Payment failed");
        
        treatment.isPaid = true;
    }
    
    function payConsultation(string memory _consultationId) external payable {
        Consultation storage consultation = consultations[_consultationId];
        require(consultation.patient == msg.sender, "Not consultation patient");
        require(!consultation.isPaid, "Already paid");
        require(msg.value >= consultation.fee, "Insufficient payment");
        
        uint256 platformFee = (consultation.fee * PLATFORM_FEE_PERCENTAGE) / 100;
        uint256 doctorAmount = consultation.fee - platformFee;
        
        // Transfer funds
        (bool success, ) = consultation.doctor.call{value: doctorAmount}("");
        require(success, "Payment failed");
        
        consultation.isPaid = true;
    }
    
    function getTreatment(string memory _treatmentId) external view returns (Treatment memory) {
        return treatments[_treatmentId];
    }
    
    function getConsultation(string memory _consultationId) external view returns (Consultation memory) {
        return consultations[_consultationId];
    }
}
