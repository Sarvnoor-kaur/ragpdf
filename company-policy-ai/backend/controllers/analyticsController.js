import Document from '../models/Document.js';
import User from '../models/User.js';
import Conversation from '../models/Conversation.js';

// Get Overview Metrics (KPIs)
export const getOverviewMetrics = async (req, res) => {
  try {
    const { startDate, endDate, department } = req.query;
    const userRole = req.user.role;
    const userDepartment = req.user.department;

    // Department filter based on role
    let departmentFilter = {};
    if (userRole === 'employee' || userRole === 'manager') {
      departmentFilter = { department: userDepartment };
    } else if (department && (userRole === 'admin' || userRole === 'hr')) {
      departmentFilter = { department };
    }

    // Total Documents (no date filter - show all available documents)
    const totalDocuments = await Document.countDocuments({
      ...departmentFilter,
      status: 'ready',
    });

    // Total Users (no date filter - show all users)
    const totalUsers = await User.countDocuments({
      ...departmentFilter,
    });

    // Date filtering for conversations and queries
    const conversationFilter = {};
    if (startDate && endDate) {
      conversationFilter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }
    
    const totalConversations = await Conversation.countDocuments(conversationFilter);

    // Total AI Queries (messages from users)
    const conversations = await Conversation.find(conversationFilter);
    let totalQueries = 0;
    let queriesWithSources = 0;

    conversations.forEach((conv) => {
      conv.messages.forEach((msg) => {
        if (msg.role === 'user') {
          totalQueries++;
        } else if (msg.role === 'assistant' && msg.sources && msg.sources.length > 0) {
          queriesWithSources++;
        }
      });
    });

    // Active Users (users who have conversations)
    const activeUserIds = await Conversation.distinct('userId', conversationFilter);
    const activeUsers = activeUserIds.length;

    res.json({
      success: true,
      data: {
        totalDocuments,
        totalUsers,
        totalConversations,
        totalQueries,
        queriesWithSources,
        activeUsers,
        percentageWithSources: totalQueries > 0 ? Math.round((queriesWithSources / totalQueries) * 100) : 0,
      },
    });
  } catch (error) {
    console.error('Error fetching overview metrics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch overview metrics',
      error: error.message,
    });
  }
};

// Get Query Trends Over Time
export const getQueryTrends = async (req, res) => {
  try {
    const { startDate, endDate, interval = 'day' } = req.query;

    const dateFilter = {};
    if (startDate) dateFilter.$gte = new Date(startDate);
    if (endDate) dateFilter.$lte = new Date(endDate);

    const matchStage = Object.keys(dateFilter).length > 0 
      ? { createdAt: dateFilter }
      : {};

    // Aggregate conversations by date
    const groupByFormat = interval === 'week' 
      ? { $isoWeek: '$createdAt' }
      : interval === 'month'
      ? { $month: '$createdAt' }
      : { $dayOfMonth: '$createdAt' };

    const trends = await Conversation.aggregate([
      { $match: matchStage },
      { $unwind: '$messages' },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            period: groupByFormat,
          },
          totalQueries: {
            $sum: { $cond: [{ $eq: ['$messages.role', 'user'] }, 1, 0] },
          },
          queriesWithSources: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$messages.role', 'assistant'] },
                    { $gt: [{ $size: { $ifNull: ['$messages.sources', []] } }, 0] },
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },
      { $sort: { '_id.year': 1, '_id.period': 1 } },
    ]);

    res.json({
      success: true,
      data: trends,
    });
  } catch (error) {
    console.error('Error fetching query trends:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch query trends',
      error: error.message,
    });
  }
};

// Get Documents by Department
export const getDocumentsByDepartment = async (req, res) => {
  try {
    const userRole = req.user.role;
    const userDepartment = req.user.department;

    let matchFilter = { status: 'ready' };
    
    // Restrict to user's department if not admin/hr
    if (userRole === 'employee' || userRole === 'manager') {
      matchFilter.department = userDepartment;
    }

    const documentsByDepartment = await Document.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: '$department',
          count: { $sum: 1 },
          totalPages: { $sum: '$totalPages' },
        },
      },
      { $sort: { count: -1 } },
    ]);

    res.json({
      success: true,
      data: documentsByDepartment,
    });
  } catch (error) {
    console.error('Error fetching documents by department:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch documents by department',
      error: error.message,
    });
  }
};

// Get Most Accessed Documents
export const getMostAccessedDocuments = async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    // Get documents referenced in conversation sources
    const documents = await Conversation.aggregate([
      { $unwind: '$messages' },
      { $unwind: '$messages.sources' },
      {
        $group: {
          _id: '$messages.sources.documentId',
          documentName: { $first: '$messages.sources.documentName' },
          accessCount: { $sum: 1 },
        },
      },
      { $sort: { accessCount: -1 } },
      { $limit: parseInt(limit) },
    ]);

    res.json({
      success: true,
      data: documents,
    });
  } catch (error) {
    console.error('Error fetching most accessed documents:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch most accessed documents',
      error: error.message,
    });
  }
};

// Get Activity Heatmap (by day and hour)
export const getActivityHeatmap = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const dateFilter = {};
    if (startDate) dateFilter.$gte = new Date(startDate);
    if (endDate) dateFilter.$lte = new Date(endDate);

    const matchStage = Object.keys(dateFilter).length > 0 
      ? { createdAt: dateFilter }
      : {};

    const heatmapData = await Conversation.aggregate([
      { $match: matchStage },
      {
        $project: {
          dayOfWeek: { $dayOfWeek: '$createdAt' }, // 1 = Sunday, 7 = Saturday
          hour: { $hour: '$createdAt' },
        },
      },
      {
        $group: {
          _id: {
            day: '$dayOfWeek',
            hour: '$hour',
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.day': 1, '_id.hour': 1 } },
    ]);

    res.json({
      success: true,
      data: heatmapData,
    });
  } catch (error) {
    console.error('Error fetching activity heatmap:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch activity heatmap',
      error: error.message,
    });
  }
};

// Get Users by Department
export const getUsersByDepartment = async (req, res) => {
  try {
    const userRole = req.user.role;

    // Only admin and hr can see all departments
    if (userRole !== 'admin' && userRole !== 'hr') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin or HR role required.',
      });
    }

    const usersByDepartment = await User.aggregate([
      {
        $group: {
          _id: '$department',
          count: { $sum: 1 },
          roles: { $push: '$role' },
        },
      },
      { $sort: { count: -1 } },
    ]);

    res.json({
      success: true,
      data: usersByDepartment,
    });
  } catch (error) {
    console.error('Error fetching users by department:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users by department',
      error: error.message,
    });
  }
};

// Get Document Status Distribution
export const getDocumentStatusDistribution = async (req, res) => {
  try {
    const userRole = req.user.role;
    const userDepartment = req.user.department;

    let matchFilter = {};
    
    if (userRole === 'employee' || userRole === 'manager') {
      matchFilter.department = userDepartment;
    }

    const statusDistribution = await Document.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]);

    res.json({
      success: true,
      data: statusDistribution,
    });
  } catch (error) {
    console.error('Error fetching document status distribution:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch document status distribution',
      error: error.message,
    });
  }
};
