const math = require('mathjs');

// Helper function to create random numbers within a range
function getRandomNumber(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Generate questions dynamically based on difficulty
function createQuestion(difficulty) {
    let question = '';
    let answer = 0;

    switch (difficulty) {
        case 'easy':
            // Simple addition or subtraction
            const num1 = getRandomNumber(1, 20);
            const num2 = getRandomNumber(1, 20);
            const operator = Math.random() > 0.5 ? '+' : '-';
            question = `${num1} ${operator} ${num2}`;
            answer = math.evaluate(question);
            break;

        case 'medium':
            // Multiplication and division
            const num3 = getRandomNumber(10, 50);
            const num4 = getRandomNumber(1, 10);
            const operatorMedium = Math.random() > 0.5 ? '*' : '/';
            question = `${num3} ${operatorMedium} ${num4}`;
            answer = math.evaluate(question);
            break;

        case 'hard':
            // Mixed operations
            const num5 = getRandomNumber(10, 50);
            const num6 = getRandomNumber(1, 20);
            const num7 = getRandomNumber(1, 10);
            question = `${num5} + (${num6} * ${num7})`;
            answer = math.evaluate(question);
            break;

        default:
            throw new Error('Invalid difficulty level');
    }

    return {
        question,
        answer,
        explanation: `The solution to ${question} is ${answer}.`
    };
}

module.exports = { createQuestion };
