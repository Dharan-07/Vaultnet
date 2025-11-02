// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./FragmentCollectible.sol";
import "./CompleteCollectible.sol";
import "./VaultToken.sol";

contract FragmentManager is Ownable {
    FragmentCollectible public fragment;
    CompleteCollectible public complete;
    VaultToken public token;

    struct Template {
        string finalURI;
        string[] fragmentURIs;
        bool exists;
    }

    mapping(uint256 => Template) public templates;
    uint256 public nextTemplateId;

    mapping(address => mapping(uint256 => uint256)) public fragmentsCollected;

    constructor(address fragmentAddr, address completeAddr, address tokenAddr, address initialOwner)
    Ownable(initialOwner)
{
    fragment = FragmentCollectible(fragmentAddr);
    complete = CompleteCollectible(completeAddr);
    token = VaultToken(tokenAddr);
}


    function createTemplate(string memory finalURI, string[] memory fragmentURIs)
        external
        onlyOwner
        returns (uint256)
    {
        templates[nextTemplateId] = Template(finalURI, fragmentURIs, true);
        return nextTemplateId++;
    }

    function rewardFragment(address user, uint256 templateId) external onlyOwner {
        Template storage t = templates[templateId];
        require(t.exists, "Template missing");
        uint256 nextIndex = fragmentsCollected[user][templateId];
        require(nextIndex < t.fragmentURIs.length, "Complete");

        fragment.mint(user, t.fragmentURIs[nextIndex]);
        fragmentsCollected[user][templateId]++;

        if (fragmentsCollected[user][templateId] == t.fragmentURIs.length) {
            complete.mint(user, t.finalURI);
        }
    }
}

