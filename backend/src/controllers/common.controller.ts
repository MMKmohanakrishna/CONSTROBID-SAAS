import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Service, City, Category, Contractor, Review, Project } from '../models';
import logger from '../utils/logger';

// Local enum stand-in for ContractorStatus
export enum ContractorStatus {
  PENDING_VERIFICATION = 'PENDING_VERIFICATION',
  VERIFIED = 'VERIFIED',
  REJECTED = 'REJECTED',
}

// GET ALL SERVICES
export async function getServices(req: Request, res: Response) {
  try {
    const services = await Service.find().lean().exec();
    return res.json(services);
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// GET ALL CITIES
export async function getCities(req: Request, res: Response) {
  try {
    const cities = await City.find().lean().exec();
    return res.json(cities);
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// GET ALL CATEGORIES
export async function getCategories(req: Request, res: Response) {
  try {
    const categories = await Category.find().lean().exec();
    return res.json(categories);
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// PUBLIC CONTRACTOR DIRECTORY SEARCH
export async function searchContractors(req: Request, res: Response) {
  const { city, category } = req.query;

  try {
    const filter: any = { status: ContractorStatus.VERIFIED };
    if (city) filter.serviceCities = city as string;
    if (category) filter.serviceCategories = category as string;

    const contractors = await Contractor.find(filter).lean().exec();

    // Fetch reviews for each contractor and compute averages
    const contractorIds = contractors.map((c: any) => c._id);
    const reviews = await Review.find({ contractorId: { $in: contractorIds } }).lean().exec();

    const reviewsByContractor: Record<string, any[]> = {};
    reviews.forEach((r: any) => {
      const key = String(r.contractorId);
      reviewsByContractor[key] = reviewsByContractor[key] || [];
      reviewsByContractor[key].push(r);
    });

    const formatted = contractors.map((c: any) => {
      const r = reviewsByContractor[String(c._id)] || [];
      const avgRating = r.length > 0 ? r.reduce((acc: number, curr: any) => acc + curr.rating, 0) / r.length : 0;
      return {
        id: c._id,
        name: c.name,
        companyName: c.companyName,
        experience: c.experience,
        serviceCategories: c.serviceCategories,
        serviceCities: c.serviceCities,
        portfolio: c.portfolio,
        rating: avgRating,
        reviewCount: r.length,
      };
    });

    return res.json(formatted);
  } catch (error) {
    logger.error('searchContractors', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// PUBLIC CONTRACTOR PROFILE
export async function getContractorProfile(req: Request, res: Response) {
  const { id } = req.params;

  try {
    const contractor = await Contractor.findOne({ $or: [{ _id: id }, { name: { $regex: `^${id}$`, $options: 'i' } }] }).lean().exec();
    const c = contractor as any;
    if (!c || c.status !== ContractorStatus.VERIFIED) return res.status(404).json({ error: 'Contractor profile not found' });

    const reviews = await Review.find({ contractorId: c._id }).populate({ path: 'projectId', select: 'title category' }).lean().exec();
    const completedProjects = await Project.find({ contractorId: c._id, status: 'PROJECT_COMPLETED' }).select('id title category city').lean().exec();

    const avgRating = reviews.length > 0 ? reviews.reduce((acc: number, curr: any) => acc + curr.rating, 0) / reviews.length : 0;

    const publicProfile = {
      id: c._id,
      name: c.name,
      companyName: c.companyName,
      experience: c.experience,
      serviceCategories: c.serviceCategories,
      serviceCities: c.serviceCities,
      portfolio: c.portfolio,
      completedProjects,
      reviews: reviews.map((r: any) => ({ id: r._id, rating: r.rating, comment: r.comment, createdAt: r.createdAt, projectTitle: (r.projectId as any)?.title, projectCategory: (r.projectId as any)?.category })),
      avgRating,
      reviewCount: reviews.length,
    };

    return res.json(publicProfile);
  } catch (error) {
    logger.error('getContractorProfile', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
