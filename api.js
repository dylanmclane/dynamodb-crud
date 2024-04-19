const db = require("./db");
const {
    GetItemCommand, 
    PutItemCommand,
    DeleteItemCommand,
    ScanCommand,
    UpdateItemCommand,
} = require("@aws-sdk/client-dynamodb");
const { marshall, unmarshall } = require("@aws-sdk/util-dynamodb");

const getAnswer = async (event) => {
    const response = { statusCode: 200 };
    
    try {
        // Make a request to the Google Gemini API
        const geminiResponse = await fetch("https://api.gemini.com");
        const data = await geminiResponse.json();
        
        response.body = JSON.stringify({
            message: "Successfully retrieved data from Gemini API.",
            data,
        });
    } catch (e) {
        console.error(e);
        response.statusCode = 500;
        response.body = JSON.stringify({
            message: "Failed to retrieve data from Gemini API.",
            errorMsg: e.message,
            errorStack: e.stack,
        });
    }
    
    return response;
};

const getCustomer = async (event) => {
    const response = { statusCode: 200 };
    
    try {
        const params = {
            TableName: process.env.DYNAMODB_TABLE_NAME,
            Key: marshall({ customerID: event.pathParameters.customerID }),
        };
        const { Item } = await db.send(new GetItemCommand(params));

        console.log({ Item });
        response.body = JSON.stringify({
            message: "Successfully retrieved customer.",
            data: (Item) ? unmarshall(Item) : {},
            rawData: Item,
        });
    } catch (e) {
        console.error(e);
        response.statusCode = 500;
        response.body = JSON.stringify({
            message: "Failed to get customer.",
            errorMsg: e.message,
            errorStack: e.stack,
        })
    }
    
    return response;
};

const createCustomer = async (event) => {
    const response = { statusCode: 200 };
    
    try {
        const body = JSON.parse(event.body);
        const params = {
            TableName: process.env.DYNAMODB_TABLE_NAME,
            Item: marshall(body || {}),
        };
        const createResult = await db.send(new PutItemCommand(params));

        response.body = JSON.stringify({
            message: "Successfully created customer.",
            createResult,
        });
    } catch (e) {
        console.error(e);
        response.statusCode = 500;
        response.body = JSON.stringify({
            message: "Failed to create customer.",
            errorMsg: e.message,
            errorStack: e.stack,
        })
    }
    
    return response;
};

const updateCustomer = async (event) => {
    const response = { statusCode: 200 };
    
    try {
        const body = JSON.parse(event.body);
        const objKeys = Object.keys(body);
        const params = {
            TableName: process.env.DYNAMODB_TABLE_NAME,
            Key: marshall({ customerID: event.pathParameters.customerID }),
            UpdateExpression: `SET ${objKeys.map((_, index) => `#key${index} = :value${index}`).join(", ")}`,
            ExpressionAttributeNames: objKeys.reduce((acc, key, index) => ({
                ...acc,
                [`#key${index}`]: key,
            }), {}),
            ExpressionAttributeValues: marshall(objKeys.reduce((acc, key, index) => ({
                ...acc,
                [`:value${index}`]: body[key],
            }), {})),
        };
        const updateResult = await db.send(new UpdateItemCommand(params));

        response.body = JSON.stringify({
            message: "Successfully updated customer.",
            updateResult,
        });
    } catch (e) {
        console.error(e);
        response.statusCode = 500;
        response.body = JSON.stringify({
            message: "Failed to update customer.",
            errorMsg: e.message,
            errorStack: e.stack,
        })
    }
    
    return response;
};

const deleteCustomer = async (event) => {
    const response = { statusCode: 200 };
    
    try {
        const params = {
            TableName: process.env.DYNAMODB_TABLE_NAME,
            Key: marshall({ customerID: event.pathParameters.customerID }),
        };
        const deleteResult = await db.send(new DeleteItemCommand(params));

        response.body = JSON.stringify({
            message: "Successfully deleted customer.",
            deleteResult,
        });
    } catch (e) {
        console.error(e);
        response.statusCode = 500;
        response.body = JSON.stringify({
            message: "Failed to delete customer.",
            errorMsg: e.message,
            errorStack: e.stack,
        })
    }
    
    return response;
};

const getAllCustomers = async (event) => {
    const response = { statusCode: 200 };
    
    try {
        const { Items } = await db.send(new ScanCommand({ TableName: process.env.DYNAMODB_TABLE_NAME }));

        response.body = JSON.stringify({
            message: "Successfully retrieved all customers.",
            data: Items.map((item) => unmarshall(item)),
            Items,
        });
    } catch (e) {
        console.error(e);
        response.statusCode = 500;
        response.body = JSON.stringify({
            message: "Failed to retrieve all customers.",
            errorMsg: e.message,
            errorStack: e.stack,
        })
    }
    
    return response;
};

// const getAnswer = async (event) => {
//     const response = { statusCode: 200 };
    
//     try {
//         const { Items } = await db.send(new ScanCommand({ TableName: process.env.DYNAMODB_TABLE_NAME }));

//         response.body = JSON.stringify({
//             message: "Successfully retrieved all customers.",
//             data: Items.map((item) => unmarshall(item)),
//             Items,
//         });
//     } catch (e) {
//         console.error(e);
//         response.statusCode = 500;
//         response.body = JSON.stringify({
//             message: "Failed to connect to LLM.",
//             errorMsg: e.message,
//             errorStack: e.stack,
//         })
//     }
    
//     return response;
// };

module.exports = {
    getCustomer,
    createCustomer,
    updateCustomer,
    deleteCustomer,
    getAllCustomers,
    getAnswer,
};