import express from 'express';
import { authorizeAdministrator } from '../components/auth';
import * as controller from '../controllers/user.controller';

const router = express.Router();

router.get('/', controller.list);

router.get('/:id', authorizeAdministrator, controller.retrieve);

router.put('/:id', authorizeAdministrator, controller.update);

router.post('/', controller.create);

export default router;
