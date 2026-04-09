import Route from '../models/Route.js';

export const createRoute = async (req, res) => {
  try {
    const { routeName, busNumber, stops, fare } = req.body;
    const route = await Route.create({ routeName, busNumber, stops, fare });
    res.status(201).json(route);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

export const getRoutes = async (req, res) => {
  try {
    const routes = await Route.find({}).sort({ createdAt: -1 });
    res.json(routes);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

export const deleteRoute = async (req, res) => {
  try {
    const route = await Route.findByIdAndDelete(req.params.id);
    if (!route) return res.status(404).json({ message: 'Route not found' });
    res.json({ message: 'Route deleted' });
  } catch (error) { res.status(500).json({ message: error.message }); }
};
