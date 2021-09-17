import { MyContext } from "src/types";
import {
  Arg,
  Ctx,
  Field,
  InputType,
  Int,
  Mutation,
  Query,
  Resolver,
  UseMiddleware,
} from "type-graphql";

import { CodeModule } from "../entities/CodeModule";
import { Lesson } from "../entities/Lesson";
import { Step } from "../entities/Step";
import { isAuth } from "../middleware/isAuth";
import { getTemplate, ITemplate, TemplatesType } from "../utils/templates";

export const DEFAULT_MD = `## Step \#

### Instructions
1. Add instructions for the step here.
2. You can use markdown to add [links](https://google.com)
3. Or use it to add \`code\` snippets.

\`\`\`
You can also write code in blocks.
\`\`\`

Remember to be short and sweet. 😘
`;

@InputType()
class StepInstructionsInput {
  @Field()
  id: number;
  @Field()
  instructions: string;
}

@InputType()
class StepNameInput {
  @Field()
  id: number;
  @Field()
  name: string;
}

@InputType()
class UpdateStepInput {
  @Field()
  id: number;
}

@InputType()
class UpdateStepCheckpointInput {
  @Field()
  id: number;
  @Field()
  checkpointId: number;
}

@InputType()
class CreateStepInput {
  @Field()
  name: string;
  @Field()
  lessonId: number;
  @Field({ nullable: true })
  currentStepId?: number;
  @Field({ nullable: true })
  template?: TemplatesType;
}

@Resolver()
export class StepResolver {
  @Query(() => [Step])
  steps(): Promise<Step[]> {
    return Step.find({
      relations: ["lesson", "checkpoints", "codeModules", "dependencies"],
    });
  }

  @Query(() => Step, { nullable: true })
  async step(@Arg("id", () => Int) id: number): Promise<Step | undefined> {
    const step = await Step.createQueryBuilder()
      .where("Step.id = :id", { id })
      .leftJoinAndSelect("Step.lesson", "lesson")
      .leftJoinAndSelect("Step.codeModules", "codeModules")
      .leftJoinAndSelect("Step.dependencies", "dependencies")
      .leftJoinAndSelect("Step.checkpoints", "checkpoints")
      .addOrderBy("checkpoints.createdAt", "ASC")
      .getOne();

    if (!step) {
      return undefined;
    }

    const currentCheckpoint = step.checkpoints.find(
      (checkpoint) => !checkpoint.isCompleted
    );

    if (!step.currentCheckpointId) {
      step.currentCheckpointId = currentCheckpoint?.id;
      await Step.save(step);
    }

    return step;
  }

  @Mutation(() => Step, { nullable: true })
  @UseMiddleware(isAuth)
  async createStep(
    @Arg("options") options: CreateStepInput
  ): Promise<Step | null> {
    const lesson = await Lesson.findOne(
      { id: options.lessonId },
      { relations: ["steps"] }
    );

    if (!lesson) {
      return null;
    }

    let template: ITemplate;

    if (options.currentStepId) {
      const prevStep = await Step.findOne(options.currentStepId, {
        relations: ["codeModules", "dependencies"],
      });

      if (!prevStep) return null;

      template = {
        codeModules: prevStep.codeModules,
        dependencies: prevStep.dependencies,
        isExecutableByBrowser: prevStep.isExecutableByBrowser,
      };
    } else {
      template = getTemplate(options.template);
    }

    const codeModules = await Promise.all(
      template.codeModules
        .filter((codeModule) => !codeModule.name.includes("spec"))
        .map(async (codeModule) => {
          // @ts-ignore
          const { id, ...rest } = codeModule;

          return await CodeModule.create({
            ...rest,
          }).save();
        })
    );

    const step = await Step.create({
      codeModules,
      instructions: DEFAULT_MD,
      name: options.name,
    }).save();

    lesson.steps.push(step);
    await lesson.save();

    return step;
  }

  @Mutation(() => Step, { nullable: true })
  @UseMiddleware(isAuth)
  async completeStep(
    @Arg("options") options: UpdateStepInput
  ): Promise<Step | null> {
    const step = await Step.findOne({ id: options.id });
    if (!step) {
      return null;
    }

    await Step.update({ id: options.id }, { ...step, isCompleted: true });

    return step;
  }

  @Mutation(() => Step, { nullable: true })
  async updateStepCheckpoint(
    @Arg("options") options: UpdateStepCheckpointInput,
    @Ctx() { req }: MyContext
  ): Promise<Step | null> {
    const step = await Step.findOne({ id: options.id });
    if (!step) {
      return null;
    }

    step.currentCheckpointId = options.checkpointId;
    if (req.session.userId) {
      await Step.save(step);
    }

    return step;
  }

  @Mutation(() => Step, { nullable: true })
  @UseMiddleware(isAuth)
  async updateStepInstructions(
    @Arg("options") options: StepInstructionsInput
  ): Promise<Step | null> {
    const step = await Step.findOne({ id: options.id });
    if (!step) {
      return null;
    }

    await Step.update(
      { id: options.id },
      { ...step, instructions: options.instructions }
    );

    return step;
  }

  @Mutation(() => Step, { nullable: true })
  @UseMiddleware(isAuth)
  async updateStepName(
    @Arg("options") options: StepNameInput
  ): Promise<Step | null> {
    const step = await Step.findOne({ id: options.id });
    if (!step) {
      return null;
    }

    await Step.update({ id: options.id }, { ...step, name: options.name });

    return step;
  }

  @Mutation(() => Boolean)
  @UseMiddleware(isAuth)
  async deleteStep(@Arg("id") id: number): Promise<boolean> {
    const step = await Step.findOne(id);

    if (!step) {
      return false;
    }

    await Step.delete(id);
    return true;
  }
}
