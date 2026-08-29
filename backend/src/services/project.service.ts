import { Project } from "../models/Project";

class ProjectService {

  async getProjectById(id: string) {
    return await Project.findById(id)
      .populate("files")
      .populate("clientId");
  }

}

export default new ProjectService();