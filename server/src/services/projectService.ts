import { Types } from 'mongoose';
import { AppError } from '../lib/errors.js';
import { Project, type ProjectDoc } from '../models/Project.js';
import { User } from '../models/User.js';
import { recordActivity } from './activityService.js';
import type { UserDocument } from '../models/User.js';
import { z } from 'zod';

const createProjectSchema = z.object({
  name: z.string().trim().min(1).max(120),
  ticketKeyPrefix: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z][A-Z0-9]{1,7}$/, 'Prefix must be 2-8 alphanumeric characters'),
  description: z.string().max(2000).optional(),
});

const updateProjectSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  description: z.string().max(2000).optional(),
});

const membersSchema = z.object({
  userIds: z.array(z.string()).min(1),
});

function serializeProject(project: ProjectDoc) {
  return {
    id: project._id.toString(),
    name: project.name,
    ticketKeyPrefix: project.ticketKeyPrefix,
    description: project.description,
    archivedAt: project.archivedAt?.toISOString() ?? null,
    members: project.members.map((member) => ({
      userId: member.userId.toString(),
      joinedAt: member.joinedAt.toISOString(),
    })),
    createdBy: project.createdBy.toString(),
    createdAt: project.createdAt.toISOString(),
    updatedAt: project.updatedAt.toISOString(),
  };
}

export async function createProject(actor: UserDocument, input: unknown) {
  const data = createProjectSchema.parse(input);
  const existing = await Project.findOne({ ticketKeyPrefix: data.ticketKeyPrefix });
  if (existing) {
    throw new AppError('Ticket key prefix already exists', 409, 'PREFIX_TAKEN');
  }

  const project = await Project.create({
    name: data.name,
    ticketKeyPrefix: data.ticketKeyPrefix,
    description: data.description ?? '',
    archivedAt: null,
    members: [{ userId: actor._id, joinedAt: new Date() }],
    createdBy: actor._id,
    ticketCounter: 0,
  });

  await recordActivity({
    projectId: project._id,
    actorId: actor._id,
    action: 'project.created',
  });

  return serializeProject(project);
}

export async function updateProject(actor: UserDocument, projectId: string, input: unknown) {
  const data = updateProjectSchema.parse(input);
  const project = await Project.findById(projectId);
  if (!project) {
    throw new AppError('Project not found', 404, 'PROJECT_NOT_FOUND');
  }
  if (project.archivedAt) {
    throw new AppError('Archived projects cannot be edited', 400, 'PROJECT_ARCHIVED');
  }

  const changes: Record<string, { from: unknown; to: unknown }> = {};
  if (data.name !== undefined && data.name !== project.name) {
    changes.name = { from: project.name, to: data.name };
    project.name = data.name;
  }
  if (data.description !== undefined && data.description !== project.description) {
    changes.description = { from: project.description, to: data.description };
    project.description = data.description;
  }
  await project.save();

  if (Object.keys(changes).length > 0) {
    await recordActivity({
      projectId: project._id,
      actorId: actor._id,
      action: 'project.updated',
      changes,
    });
  }

  return serializeProject(project);
}

export async function archiveProject(actor: UserDocument, projectId: string) {
  const project = await Project.findById(projectId);
  if (!project) {
    throw new AppError('Project not found', 404, 'PROJECT_NOT_FOUND');
  }
  if (project.archivedAt) {
    return serializeProject(project);
  }
  project.archivedAt = new Date();
  await project.save();
  await recordActivity({
    projectId: project._id,
    actorId: actor._id,
    action: 'project.archived',
  });
  return serializeProject(project);
}

export async function listProjectsForUser(userId: string) {
  const projects = await Project.find({
    members: { $elemMatch: { userId: new Types.ObjectId(userId) } },
  }).sort({ updatedAt: -1 });
  return projects.map(serializeProject);
}

export async function getProjectForMember(projectId: string, userId: string) {
  const project = await Project.findById(projectId);
  if (!project) {
    throw new AppError('Project not found', 404, 'PROJECT_NOT_FOUND');
  }
  const isMember = project.members.some((m) => m.userId.toString() === userId);
  if (!isMember) {
    throw new AppError('You are not a member of this project', 403, 'FORBIDDEN');
  }
  return project;
}

export async function setProjectMembers(actor: UserDocument, projectId: string, input: unknown) {
  const data = membersSchema.parse(input);
  const project = await Project.findById(projectId);
  if (!project) {
    throw new AppError('Project not found', 404, 'PROJECT_NOT_FOUND');
  }

  const objectIds = data.userIds.map((id) => new Types.ObjectId(id));
  const users = await User.find({ _id: { $in: objectIds } });
  if (users.length !== objectIds.length) {
    throw new AppError('One or more users were not found', 400, 'USER_NOT_FOUND');
  }

  const now = new Date();
  project.members = objectIds.map((userId) => {
    const existing = project.members.find((m) => m.userId.equals(userId));
    return existing ?? { userId, joinedAt: now };
  });
  await project.save();

  await recordActivity({
    projectId: project._id,
    actorId: actor._id,
    action: 'project.members_updated',
    changes: { memberCount: { from: null, to: project.members.length } },
  });

  return serializeProject(project);
}
