const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, PutCommand, GetCommand, UpdateCommand } = require("@aws-sdk/lib-dynamodb");
const crypto = require("crypto");
const nodemailer = require("nodemailer");

// إعداد الاتصال بقاعدة البيانات
const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);
const TABLE_NAME = process.env.POLLS_TABLE;

// 1. دالة إنشاء التصويت
module.exports.createPoll = async (event) => {
  try {
    if (!event.body) return { statusCode: 400, body: JSON.stringify({ message: "No body provided" }) };
    const { question, options } = JSON.parse(event.body);
    if (!question || !options || options.length < 2) return { statusCode: 400, body: JSON.stringify({ message: "Invalid data" }) };

    const pollId = crypto.randomUUID();
    const formattedOptions = options.map((opt, i) => ({ id: `opt_${i + 1}`, text: opt, votes: 0 }));
    
    const pollItem = { pollId, question, options: formattedOptions, createdAt: new Date().toISOString(), totalVotes: 0 };
    await docClient.send(new PutCommand({ TableName: TABLE_NAME, Item: pollItem }));

    return { statusCode: 201, body: JSON.stringify({ message: "Poll created successfully", pollId, poll: pollItem }) };
  } catch (err) {
    console.error("Error creating poll:", err);
    return { statusCode: 500, body: JSON.stringify({ message: "internal server error" }) };
  }
};

// 2. دالة جلب التصويت
module.exports.getPollResults = async (event) => {
  try {
    const pollId = event.pathParameters.pollId;
    const { Item } = await docClient.send(new GetCommand({ TableName: TABLE_NAME, Key: { pollId } }));
    
    if (!Item) return { statusCode: 404, body: JSON.stringify({ message: "Poll not found" }) };
    return { statusCode: 200, body: JSON.stringify(Item) };
  } catch (err) {
    console.error("Error getting poll:", err);
    return { statusCode: 500, body: JSON.stringify({ message: "internal server error" }) };
  }
};

// 3. دالة التصويت
module.exports.castVote = async (event) => {
  try {
    const pollId = event.pathParameters.pollId;
    if (!event.body) return { statusCode: 400, body: JSON.stringify({ message: "No body provided" }) };
    const { optionId } = JSON.parse(event.body);
    
    const { Item } = await docClient.send(new GetCommand({ TableName: TABLE_NAME, Key: { pollId } }));
    if (!Item) return { statusCode: 404, body: JSON.stringify({ message: "Poll not found" }) };
    
    const optionIndex = Item.options.findIndex(opt => opt.id === optionId);
    if (optionIndex === -1) return { statusCode: 400, body: JSON.stringify({ message: "Invalid option" }) };

    await docClient.send(new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { pollId },
      UpdateExpression: `SET options[${optionIndex}].votes = options[${optionIndex}].votes + :inc, totalVotes = totalVotes + :inc`,
      ExpressionAttributeValues: { ":inc": 1 },
      ReturnValues: "UPDATED_NEW"
    }));

    return { statusCode: 200, body: JSON.stringify({ message: "Vote cast successfully" }) };
  } catch (err) {
    console.error("Error voting:", err);
    return { statusCode: 500, body: JSON.stringify({ message: "internal server error" }) };
  }
};

// 4. دالة إرسال النتائج (Email Integration)
module.exports.sendResults = async (event) => {
  try {
    const pollId = event.pathParameters.pollId;
    if (!event.body) return { statusCode: 400, body: JSON.stringify({ message: "No body provided" }) };
    
    const { email } = JSON.parse(event.body);
    if (!email) return { statusCode: 400, body: JSON.stringify({ message: "Email is required" }) };

    const { Item } = await docClient.send(new GetCommand({ TableName: TABLE_NAME, Key: { pollId } }));
    if (!Item) return { statusCode: 404, body: JSON.stringify({ message: "Poll not found" }) };

    let resultsText = `مرحباً،\n\nإليك نتائج التصويت الخاص بك:\nالسؤال: ${Item.question}\n\nالنتائج:\n`;
    Item.options.forEach(opt => { resultsText += `- ${opt.text}: ${opt.votes} صوت\n`; });
    resultsText += `\nإجمالي الأصوات: ${Item.totalVotes}\n\nشكراً لاستخدامك منصتنا!`;

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {

      },
    });

    await transporter.sendMail({
      from: `"Poll System" <dhmey0011@gmail.com>`,
      to: email,
      subject: `نتائج التصويت: ${Item.question}`,
      text: resultsText,
    });

    return { statusCode: 200, body: JSON.stringify({ message: "Results sent successfully" }) };
  } catch (err) {
    console.error("Email Error:", err);
    return { statusCode: 500, body: JSON.stringify({ message: "Failed to send email" }) };
  }
};
