// SPDX-License-Identifier: UNLICENSED

pragma solidity 0.8.4;

import "./lib/access/AccessControl.sol";

/**
 * @dev Implementation of the user control inside the Taureum NFT ecosystem.
 * It manages user levels, how many tokens they can own.
 * This contract inherits from the AccessControl contract.
 *
 * TODO: Add more definition and requirements for this contract. Perhaps the name should be changed.
 */
contract TaureumKYC is AccessControl {
    /**
     * @dev The role to add and define user levels.
     */
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    /**
     * @dev The role to add and define user levels.
     */
    mapping(address => uint256) internal ownerToLimit;

    /**
     * @dev Emitted when `account` is given the permission to own upto `limit` TaureumNTFs.
     *
     */
    event AddUser(address indexed user, uint256 indexed limit);

    /**
     * @dev Guarantee that the msg.Sender has the `ADMIN_ROLE` to add new user.
     */
    modifier canAddUser() {
        require(hasRole(ADMIN_ROLE, msg.sender), "User does not have ADMIN_ROLE");
        _;
    }
    /**
     * @dev Create a new access control interface for managing user access with a single admin account.
     * @param _onlyAdmin a single address allowed to add new user roles. It should be the contract address that `deploys`
     * the TaureumNFT.
     */
    constructor(address _onlyAdmin) {
        _setupRole(ADMIN_ROLE, _onlyAdmin);
    }

    /**
     * @dev Add and define new users and their limit on owning TaureumNFTs.
     * @param _user The user address wished to add.
     * @param _limit The limit of _user.
     *
     * Emit an {AddUser} event.
     */
    function addUser(address _user, uint256 _limit) external canAddUser() {
        ownerToLimit[_user] = _limit;
        emit AddUser(_user, _limit);
    }

    /**
     * @dev Get the TaureumNFT-owning limit of the address _user.
     * @notice It does no check on whether _user has been added. If so, it returns 0.
     */
    function getUserLimit(address _user) public view virtual returns (uint256) {
        require(_user != address(0), "INVALID_USER_ADDRESS");
        return ownerToLimit[_user];
    }
}
