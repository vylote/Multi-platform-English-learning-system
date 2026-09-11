const topicRepository = require("../repositories/topic.repository");

class TopicService {
  async getAllTopics() {
    return topicRepository.findAll();
  }
}

module.exports = new TopicService();