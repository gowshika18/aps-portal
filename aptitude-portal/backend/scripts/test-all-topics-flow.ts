import { TestService } from '../src/services/test.service';
import { prisma } from '../src/utils/prisma';

async function testAllTopicsFlow() {
  const student = await prisma.student.findFirst();
  if (!student) {
    throw new Error('No student found in DB for testing.');
  }

  console.log('Using an existing student record for read-only flow verification.');

  const topics = await TestService.getTopicsWithStudentProgress(student.id);
  console.log(`Retrieved ${topics.length} topics.`);

  let totalTestsVerified = 0;
  let totalQuestionsVerified = 0;
  const errors: string[] = [];

  // Check first topic, middle topics, and last topic
  for (let i = 0; i < topics.length; i++) {
    const topic = topics[i];
    const topicDetails = await TestService.getTopicDetails(topic.id, student.id);

    if (!topicDetails.topic || !topicDetails.tests || topicDetails.tests.length !== 3) {
      errors.push(`Topic #${i + 1} (${topic.name}) returned invalid tests count: ${topicDetails.tests?.length}`);
      continue;
    }

    for (const test of topicDetails.tests) {
      totalTestsVerified++;
      const testData = await TestService.getTestById(test.id, student.id);
      if (!testData.questions || testData.questions.length !== 20) {
        errors.push(`Topic ${topic.name} -> Test ${test.testNumber} (${test.id}) returned ${testData.questions?.length} questions instead of 20`);
      } else {
        totalQuestionsVerified += testData.questions.length;
        const expectedNumbers = Array.from({ length: 20 }, (_, index) => index + 1);
        if (testData.questions.some((question, index) => question.questionNumber !== expectedNumbers[index])) {
          errors.push(`Topic ${topic.name} -> Test ${test.testNumber} returned questions out of order`);
        }
        if (testData.questions.some((question) => 'correctOption' in question || 'explanation' in question)) {
          errors.push(`Topic ${topic.name} -> Test ${test.testNumber} exposed answer key or explanation`);
        }
      }
    }
  }

  console.log(`\n========================================`);
  console.log(`ALL 35 TOPICS API FLOW VERIFICATION`);
  console.log(`========================================`);
  console.log(`Topics Verified: ${topics.length} / 35`);
  console.log(`Tests Verified: ${totalTestsVerified} / 105`);
  console.log(`Questions Verified: ${totalQuestionsVerified} / 2100`);
  console.log(`Errors Found: ${errors.length}`);
  if (errors.length > 0) {
    console.log(`Error Details:`, errors);
    process.exitCode = 1;
  }
}

testAllTopicsFlow()
  .catch((error) => {
    console.error('Selected-test flow verification failed:', error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
