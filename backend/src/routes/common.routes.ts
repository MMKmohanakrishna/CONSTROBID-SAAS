import { Router } from 'express';
import {
  getServices,
  getCities,
  getCategories,
  searchContractors,
  getContractorProfile
} from '../controllers/common.controller';

const router = Router();

router.get('/services', getServices);
router.get('/cities', getCities);
router.get('/categories', getCategories);
router.get('/contractors', searchContractors);
router.get('/contractors/:id', getContractorProfile);

export default router;
