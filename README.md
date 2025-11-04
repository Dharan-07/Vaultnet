# Finalyear

I used CREATE2 @openzepplein for smart contract by using it we can deploy the contract script file [deploy.js] one only time and use the smae address for every time uploading a model. Without the CREATE2 we need to deploy the deploy,js of smart contract file everytime after closing the terminal and trying to access the smart contract.

If the smart contract deployed by using deploy.js file need to change the contract address in the .env file 


// const filePath = path.resolve("assets/model-v1.json");
this line from the addModel.mjs, while adding the model you need to change this line by adding the file name to new name.
