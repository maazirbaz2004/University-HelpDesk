const { Connection, Request, TYPES } = require('tedious');
const { VarChar } = require('msnodesqlv8');
const config = {
  server: "localhost\\SQLEXPRESS",
  authentication: {
    type: 'default',
    options: {
      userName: 'sa',
      password: 'maaz200402',
    },
  },
  options: {
    database: 'UniversityHelpdeskDB',
    encrypt: false,
    trustServerCertificate: true,
  },
};
const executeQuery = (query, parameters = []) => {
  return new Promise((resolve, reject) => {
    const connection = new Connection(config);

    connection.on('connect', (err) => {
      if (err) {
        console.error('DB Connection Error:', err);
        return reject(err);
      }

      const request = new Request(query, (err, rowCount) => {
        if (err) {
          console.error('Query Error:', err);
          return reject(err);
        }
        console.log(`Query executed successfully. Rows affected: ${rowCount}`);
        connection.close();
      });

      const result = [];
      request.on('row', (columns) => {
        const rowObj = {};
        columns.forEach(col => {
          rowObj[col.metadata.colName] = col.value;
        });
        result.push(rowObj);
      });

      request.on('requestCompleted', () => resolve(result));

      parameters.forEach(param => {
        try {
          request.addParameter(param.name, param.type, param.value);
        } catch (error) {
          console.error('Parameter Error:', error);
          return reject(error);
        }
      });

      connection.execSql(request);
    });

    connection.on('error', (err) => reject(err));
    connection.connect();
  });
};
const registerStudent = async (data) => {
    const query = `
        DECLARE @NewStudentId  INT,
                @ResultCode    INT,
                @ResultMessage VARCHAR(255);
 
        EXEC RegisterStudent
            @Name          = @Name,
            @Email         = @Email,
            @Password      = @Password,
            @Phone         = @Phone,
            @DepartmentId  = @DepartmentId,
            @NewStudentId  = @NewStudentId  OUTPUT,
            @ResultCode    = @ResultCode    OUTPUT,
            @ResultMessage = @ResultMessage OUTPUT;
 
        SELECT
            @NewStudentId  AS NewStudentId,
            @ResultCode    AS ResultCode,
            @ResultMessage AS ResultMessage;
    `;
 
    const parameters = [
        { name: 'Name',         type: TYPES.VarChar,  value: data.name },
        { name: 'Email',        type: TYPES.VarChar,  value: data.email },
        { name: 'Password',     type: TYPES.VarChar,  value: data.password },
        { name: 'Phone',        type: TYPES.VarChar,  value: data.phone },
        { name: 'DepartmentId', type: TYPES.Int,      value: data.departmentId ?? null },
    ];
 
    return await executeQuery(query, parameters);
};
const getDepartments = async () => {
    const query = `
        SELECT
            department_id   AS departmentId,
            department_name AS departmentName
        FROM Departments
        ORDER BY department_name;
    `;

    return await executeQuery(query, []);   // no parameters needed for this query
};
const loginUser = async (email) => {
    const query = `
        DECLARE @ResultCode    INT,
                @ResultMessage VARCHAR(200),
                @UserId        INT,
                @Role          VARCHAR(20),
                @PasswordHash  VARCHAR(255),
                @Name          VARCHAR(100),
                @DepartmentId  INT;
 
        EXEC Login
            @Email         = @Email,
            @ResultCode    = @ResultCode    OUTPUT,
            @ResultMessage = @ResultMessage OUTPUT,
            @UserId        = @UserId        OUTPUT,
            @Role          = @Role          OUTPUT,
            @PasswordHash  = @PasswordHash  OUTPUT,
            @Name          = @Name          OUTPUT,
            @DepartmentId  = @DepartmentId  OUTPUT;
 
        SELECT
            @ResultCode    AS ResultCode,
            @ResultMessage AS ResultMessage,
            @UserId        AS UserId,
            @Role          AS Role,
            @PasswordHash  AS PasswordHash,
            @Name          AS Name,
            @DepartmentId  AS DepartmentId;
    `;
 
    const parameters = [
        { name: 'Email', type: TYPES.VarChar, value: email }
    ];
 
    return await executeQuery(query, parameters);
};
const adminLogin = async (email) => {
    const query = `
        DECLARE @ResultCode    INT,
                @ResultMessage VARCHAR(200),
                @AdminId       INT,
                @PasswordHash  VARCHAR(255),
                @Name          VARCHAR(100);
        EXEC AdminLogin
            @Email         = @Email,
            @ResultCode    = @ResultCode    OUTPUT,
            @ResultMessage = @ResultMessage OUTPUT,
            @AdminId       = @AdminId       OUTPUT,
            @PasswordHash  = @PasswordHash  OUTPUT,
            @Name          = @Name          OUTPUT;
 
        SELECT
            @ResultCode    AS ResultCode,
            @ResultMessage AS ResultMessage,
            @AdminId       AS AdminId,
            @PasswordHash  AS PasswordHash,
            @Name          AS Name;
    `;
 
    const parameters = [
        { name: 'Email', type: TYPES.VarChar, value: email }
    ];
 
    return await executeQuery(query, parameters);
};
const getComplaintsForAdmin = async ({ filter = 'all', departmentId = null, priority = null } = {}) => {
    const query = `
        DECLARE @ResultCode    INT,
                @ResultMessage VARCHAR(200);

        EXEC GetComplaintsForAdmin
            @Filter       = @Filter,
            @DepartmentId = @DepartmentId,
            @Priority     = @Priority;
    `;
    const parameters = [
        { name: 'Filter',       type: TYPES.VarChar, value: filter },
        { name: 'DepartmentId', type: TYPES.Int,     value: departmentId ? parseInt(departmentId) : null },
        { name: 'Priority',     type: TYPES.VarChar, value: priority || null },
    ];
    return await executeQuery(query, parameters);
};

const updateComplaintPriority = async (complaintId, newPriority, adminId) => {
    const query = `
        DECLARE @ResultCode    INT,
                @ResultMessage VARCHAR(200);

        EXEC UpdateComplaintPriority
            @ComplaintId   = @ComplaintId,
            @NewPriority   = @NewPriority,
            @AdminId       = @AdminId,
            @ResultCode    = @ResultCode    OUTPUT,
            @ResultMessage = @ResultMessage OUTPUT;

        SELECT @ResultCode AS ResultCode, @ResultMessage AS ResultMessage;
    `;
    const parameters = [
        { name: 'ComplaintId', type: TYPES.Int,     value: parseInt(complaintId) },
        { name: 'NewPriority', type: TYPES.VarChar, value: newPriority },
        { name: 'AdminId',     type: TYPES.Int,     value: parseInt(adminId) },
    ];
    return await executeQuery(query, parameters);
};

const updateComplaintStatus = async (complaintId, newStatus, adminId) => {
    const query = `
        DECLARE @ResultCode    INT,
                @ResultMessage VARCHAR(200);

        EXEC UpdateComplaintStatus
            @ComplaintId   = @ComplaintId,
            @NewStatus     = @NewStatus,
            @AdminId       = @AdminId,
            @ResultCode    = @ResultCode    OUTPUT,
            @ResultMessage = @ResultMessage OUTPUT;

        SELECT @ResultCode AS ResultCode, @ResultMessage AS ResultMessage;
    `;
    const parameters = [
        { name: 'ComplaintId', type: TYPES.Int,     value: parseInt(complaintId) },
        { name: 'NewStatus',   type: TYPES.VarChar, value: newStatus },
        { name: 'AdminId',     type: TYPES.Int,     value: parseInt(adminId) },
    ];
    return await executeQuery(query, parameters);
};

const getComplaintHistory = async (complaintId) => {
    const query = `
        EXEC GetComplaintHistory @ComplaintId = @ComplaintId;
    `;
    const parameters = [
        { name: 'ComplaintId', type: TYPES.Int, value: parseInt(complaintId) },
    ];
    return await executeQuery(query, parameters);
};

const getDepartmentWiseReport = async () => {
    const query = `
        EXEC GetDepartmentWiseReport;
    `;
    return await executeQuery(query, []);
};

module.exports = {
    registerStudent,
    getDepartments,
    loginUser,
    adminLogin,
    executeQuery,
    getComplaintsForAdmin,
    updateComplaintPriority,
    updateComplaintStatus,
    getComplaintHistory,
    getDepartmentWiseReport,
};