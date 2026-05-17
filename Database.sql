CREATE DATABASE UniversityHelpdeskDB;
GO
USE UniversityHelpdeskDB
GO

-- =============================================
-- TABLES
-- =============================================

CREATE TABLE Departments
(
    department_id INT IDENTITY(1,1) PRIMARY KEY,
    department_name VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE Admins
(
    admin_id INT IDENTITY(1,1) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    created_at DATETIME DEFAULT GETDATE()
);

CREATE TABLE Staff
(
    staff_id INT IDENTITY(1,1) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    department_id INT NOT NULL,
    created_at DATETIME DEFAULT GETDATE(),
    is_active BIT NOT NULL DEFAULT 1,
    FOREIGN KEY (department_id) REFERENCES Departments(department_id)
);

CREATE TABLE Students
(
    student_id INT IDENTITY(1,1) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    department_id INT NULL,
    created_at DATETIME DEFAULT GETDATE(),
    is_active BIT NOT NULL DEFAULT 1,
    FOREIGN KEY (department_id) REFERENCES Departments(department_id)
);


CREATE TABLE ComplaintCategories
(
    category_id INT IDENTITY(1,1) PRIMARY KEY,
    category_name VARCHAR(100) NOT NULL,
    department_id INT,
    FOREIGN KEY (department_id) REFERENCES Departments(department_id)
);

CREATE TABLE Complaints
(
    complaint_id INT IDENTITY(1,1) PRIMARY KEY,
    student_id INT NOT NULL,
    department_id INT NOT NULL,
    category_id INT,
    title VARCHAR(200),
    description TEXT,
    priority VARCHAR(10) NOT NULL DEFAULT 'Medium' CHECK (priority IN ('Low', 'Medium', 'High')),
    status VARCHAR(20) NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'In-Progress', 'Resolved', 'Rejected', 'Reopened', 'Reopen-Requested')),
    is_starred BIT DEFAULT 0,
    is_major_incident BIT DEFAULT 0,
    parent_complaint_id INT NULL,
    assigned_to_staff_id INT NULL,
    assigned_by_admin_id INT NULL,
    assignment_date DATETIME NULL,
    submission_date DATETIME DEFAULT GETDATE(),
    deadline DATETIME,
    FOREIGN KEY (student_id)           REFERENCES Students(student_id),
    FOREIGN KEY (department_id)        REFERENCES Departments(department_id),
    FOREIGN KEY (category_id)          REFERENCES ComplaintCategories(category_id),
    FOREIGN KEY (assigned_to_staff_id) REFERENCES Staff(staff_id),
    FOREIGN KEY (assigned_by_admin_id) REFERENCES Admins(admin_id)
);

CREATE TABLE History
(
    history_id INT IDENTITY(1,1) PRIMARY KEY,
    complaint_id INT NOT NULL,
    changed_by_student_id INT NULL,
    changed_by_staff_id INT NULL,
    changed_by_admin_id INT NULL,
    action_type VARCHAR(30) NOT NULL CHECK (action_type IN ('StatusChange', 'Assignment', 'ReopenRequest', 'Escalation', 'Note', 'CascadedStatusUpdate')),
    old_status VARCHAR(20),
    new_status VARCHAR(20),
    remarks TEXT,
    change_time DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (complaint_id)          REFERENCES Complaints(complaint_id),
    FOREIGN KEY (changed_by_student_id) REFERENCES Students(student_id),
    FOREIGN KEY (changed_by_staff_id)   REFERENCES Staff(staff_id),
    FOREIGN KEY (changed_by_admin_id)   REFERENCES Admins(admin_id)
);

CREATE TABLE Feedback
(
    feedback_id INT IDENTITY(1,1) PRIMARY KEY,
    complaint_id INT NOT NULL UNIQUE,
    student_id INT NOT NULL,
    rating INT CHECK (rating BETWEEN 1 AND 5),
    comments TEXT,
    feedback_date DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (complaint_id) REFERENCES Complaints(complaint_id),
    FOREIGN KEY (student_id)   REFERENCES Students(student_id)
);

CREATE TABLE Notifications
(
    notification_id INT IDENTITY(1,1) PRIMARY KEY,
    complaint_id INT NULL,
    student_id INT NULL,
    staff_id INT NULL,
    admin_id INT NULL,
    notification_type VARCHAR(30) NOT NULL CHECK (notification_type IN ('Submitted', 'Assigned', 'StatusUpdate', 'ReopenRequest', 'Feedback', 'Overdue')),
    message TEXT,
    is_read BIT DEFAULT 0,
    created_at DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (complaint_id) REFERENCES Complaints(complaint_id),
    FOREIGN KEY (student_id)   REFERENCES Students(student_id),
    FOREIGN KEY (staff_id)     REFERENCES Staff(staff_id),
    FOREIGN KEY (admin_id)     REFERENCES Admins(admin_id)
);
GO

UPDATE Complaints SET is_starred = 0 WHERE is_starred IS NULL;
UPDATE Complaints SET is_major_incident = 0 WHERE is_major_incident IS NULL;
GO

-- =============================================
-- PROCEDURES: ADMIN
-- =============================================
-- Authenticates admin users
CREATE OR ALTER PROCEDURE AdminLogin
    @Email         VARCHAR(100),
    @ResultCode    INT          OUTPUT,
    @ResultMessage VARCHAR(200) OUTPUT,
    @AdminId       INT          OUTPUT,
    @PasswordHash  VARCHAR(255) OUTPUT,
    @Name          VARCHAR(100) OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    SET @ResultCode    = 1;
    SET @ResultMessage = 'Email not found';
    SET @AdminId       = NULL;
    SET @PasswordHash  = NULL;
    SET @Name          = NULL;

    BEGIN TRY
        IF EXISTS (SELECT 1 FROM Admins WHERE email = LOWER(LTRIM(RTRIM(@Email))))
        BEGIN
            SELECT @AdminId = admin_id, @PasswordHash = password, @Name = name
            FROM Admins
            WHERE email = LOWER(LTRIM(RTRIM(@Email)));
            SET @ResultCode    = 0;
            SET @ResultMessage = 'Admin found';
        END
        ELSE
        BEGIN
            SET @ResultCode    = 1;
            SET @ResultMessage = 'Invalid email or password';
        END
    END TRY
    BEGIN CATCH
        SET @ResultCode    = 2;
        SET @ResultMessage = 'Unexpected error: ' + ERROR_MESSAGE();
    END CATCH
END;
GO

-- Retrieves complaints for admin view with filtering
CREATE OR ALTER PROCEDURE GetComplaintsForAdmin
    @Filter       VARCHAR(20)  = 'all',
    @DepartmentId INT          = NULL,
    @Priority     VARCHAR(10)  = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SELECT
        c.complaint_id,
        c.title,
        c.description,
        c.priority,
        c.status,
        c.submission_date,
        c.deadline,
        c.assignment_date,
        d.department_name,
        c.department_id,
        cc.category_name,
        s.name AS student_name,
        s.email AS student_email,
        st.name AS assigned_to_staff_name,
        st.email AS assigned_to_staff_email,
        a.name AS assigned_by_admin_name,
        CAST(ISNULL(c.is_starred, 0) AS INT) AS is_starred,
        CAST(ISNULL(c.is_major_incident, 0) AS INT) AS is_major_incident,
        c.parent_complaint_id,
        CASE WHEN EXISTS (SELECT 1 FROM History h WHERE h.complaint_id = c.complaint_id) THEN 0 ELSE 1 END AS is_new
    FROM Complaints c
    JOIN Departments d ON d.department_id = c.department_id
    LEFT JOIN ComplaintCategories cc ON cc.category_id = c.category_id
    JOIN Students s ON s.student_id = c.student_id
    LEFT JOIN Staff st ON st.staff_id = c.assigned_to_staff_id
    LEFT JOIN Admins a ON a.admin_id = c.assigned_by_admin_id
    WHERE 1 = (CASE 
            WHEN LTRIM(RTRIM(LOWER(@Filter))) = 'all' THEN 1
            WHEN LTRIM(RTRIM(LOWER(@Filter))) = 'unassigned' AND c.assigned_to_staff_id IS NULL THEN 1
            WHEN LTRIM(RTRIM(LOWER(@Filter))) = 'assigned' AND c.assigned_to_staff_id IS NOT NULL THEN 1
            WHEN LTRIM(RTRIM(LOWER(@Filter))) = 'starred' AND ISNULL(c.is_starred, 0) = 1 THEN 1
            ELSE 0
        END)
        AND (@DepartmentId IS NULL OR c.department_id = @DepartmentId)
        AND (@Priority IS NULL OR c.priority = @Priority)
    ORDER BY
        CASE WHEN EXISTS (SELECT 1 FROM History h WHERE h.complaint_id = c.complaint_id) THEN 1 ELSE 0 END,
        c.submission_date DESC;
END;
GO

-- Transaction for Assigning Complaint to Staff
-- Ensures that the complaint update, history log, and staff notification all succeed or fail together.
CREATE OR ALTER PROCEDURE AssignComplaintToStaff
    @ComplaintId INT,
    @StaffId     INT,
    @AdminId     INT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;

        -- 1. Update the complaint details and status
        UPDATE Complaints
        SET assigned_to_staff_id = @StaffId,
            assigned_by_admin_id = @AdminId,
            assignment_date      = GETDATE(),
            status               = 'In-Progress'
        WHERE complaint_id = @ComplaintId;

        -- 2. Log the assignment in History
        INSERT INTO History (complaint_id, changed_by_admin_id, action_type, remarks)
        VALUES (@ComplaintId, @AdminId, 'Assignment', 'Complaint assigned to staff');

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO

-- Transaction for Status Update with Cascading (Major Incident)
-- Handles complex cascading updates where resolving a Major (STAR) incident resolves all linked child complaints.
-- Ensures that parent and child records are updated atomically to prevent inconsistent states.
CREATE OR ALTER PROCEDURE UpdateComplaintStatus
    @ComplaintId  INT,
    @NewStatus    VARCHAR(20),
    @AdminId      INT,
    @ResultCode   INT          OUTPUT,
    @ResultMessage VARCHAR(200) OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    SET @ResultCode    = 0;
    SET @ResultMessage = '';
    BEGIN TRY
        IF @NewStatus NOT IN ('Pending', 'In-Progress', 'Resolved', 'Rejected', 'Reopened', 'Reopen-Requested')
        BEGIN
            SET @ResultCode    = 1;
            SET @ResultMessage = 'Invalid status value.';
            RETURN;
        END

        IF NOT EXISTS (SELECT 1 FROM Complaints WHERE complaint_id = @ComplaintId)
        BEGIN
            SET @ResultCode    = 2;
            SET @ResultMessage = 'Complaint not found.';
            RETURN;
        END

        BEGIN TRANSACTION;

        DECLARE @OldStatus VARCHAR(20);
        SELECT @OldStatus = status FROM Complaints WHERE complaint_id = @ComplaintId;

        -- 1. Update the main complaint status
        UPDATE Complaints SET status = @NewStatus WHERE complaint_id = @ComplaintId;

        -- 2. Log history for the main complaint
        INSERT INTO History (complaint_id, changed_by_admin_id, action_type, old_status, new_status, remarks)
        VALUES (@ComplaintId, @AdminId, 'StatusChange', @OldStatus, @NewStatus, 'Status changed from ' + @OldStatus + ' to ' + @NewStatus);

        -- 3. Notifications handled by trg_NotifyStudentOnStatusChange trigger.

        -- 4. If resolving a Major Incident, cascade the status to all linked child complaints
        IF @NewStatus IN ('Resolved', 'Rejected')
        BEGIN
            -- If this IS a parent, resolve all its children
            UPDATE Complaints SET status = @NewStatus WHERE parent_complaint_id = @ComplaintId;
            
            INSERT INTO History (complaint_id, changed_by_admin_id, action_type, old_status, new_status, remarks)
            SELECT complaint_id, @AdminId, 'CascadedStatusUpdate', 'In-Progress', @NewStatus, 'Automatically resolved via STAR Incident #' + CAST(@ComplaintId AS VARCHAR(10))
            FROM Complaints WHERE parent_complaint_id = @ComplaintId;

            -- If this is a CHILD, resolve the parent
            DECLARE @ParentId INT;
            SELECT @ParentId = parent_complaint_id FROM Complaints WHERE complaint_id = @ComplaintId;
            
            IF @ParentId IS NOT NULL
            BEGIN
                UPDATE Complaints SET status = @NewStatus WHERE complaint_id = @ParentId;
                
                INSERT INTO History (complaint_id, changed_by_admin_id, action_type, old_status, new_status, remarks)
                VALUES (@ParentId, @AdminId, 'StatusChange', 'In-Progress', @NewStatus, 'Parent resolved via resolution of clustered complaint #' + CAST(@ComplaintId AS VARCHAR(10)));

                UPDATE Complaints SET status = @NewStatus WHERE parent_complaint_id = @ParentId AND complaint_id != @ComplaintId;
                
                INSERT INTO History (complaint_id, changed_by_admin_id, action_type, old_status, new_status, remarks)
                SELECT complaint_id, @AdminId, 'CascadedStatusUpdate', 'In-Progress', @NewStatus, 'Resolved via parent resolution (from sibling #' + CAST(@ComplaintId AS VARCHAR(10)) + ')'
                FROM Complaints WHERE parent_complaint_id = @ParentId AND complaint_id != @ComplaintId;
            END
        END

        COMMIT TRANSACTION;
        SET @ResultCode    = 0;
        SET @ResultMessage = 'Status updated successfully.';
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        SET @ResultCode    = 3;
        SET @ResultMessage = 'Error: ' + ERROR_MESSAGE();
    END CATCH
END;
GO

-- Updates complaint priority level
CREATE OR ALTER PROCEDURE UpdateComplaintPriority
    @ComplaintId  INT,
    @NewPriority  VARCHAR(10),
    @AdminId      INT,
    @ResultCode   INT          OUTPUT,
    @ResultMessage VARCHAR(200) OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    SET @ResultCode    = 0;
    SET @ResultMessage = '';
    BEGIN TRY
        IF @NewPriority NOT IN ('Low', 'Medium', 'High')
        BEGIN
            SET @ResultCode    = 1;
            SET @ResultMessage = 'Invalid priority value.';
            RETURN;
        END

        IF NOT EXISTS (SELECT 1 FROM Complaints WHERE complaint_id = @ComplaintId)
        BEGIN
            SET @ResultCode    = 2;
            SET @ResultMessage = 'Complaint not found.';
            RETURN;
        END

        DECLARE @OldPriority VARCHAR(10);
        SELECT @OldPriority = priority FROM Complaints WHERE complaint_id = @ComplaintId;

        UPDATE Complaints SET priority = @NewPriority WHERE complaint_id = @ComplaintId;

        INSERT INTO History (complaint_id, changed_by_admin_id, action_type, remarks)
        VALUES (@ComplaintId, @AdminId, 'Note', 'Priority changed from ' + @OldPriority + ' to ' + @NewPriority);

        SET @ResultCode    = 0;
        SET @ResultMessage = 'Priority updated successfully.';
    END TRY
    BEGIN CATCH
        SET @ResultCode    = 3;
        SET @ResultMessage = 'Error: ' + ERROR_MESSAGE();
    END CATCH
END;
GO

-- Retrieves full history of a complaint
CREATE OR ALTER PROCEDURE GetComplaintHistory
    @ComplaintId INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT
        h.history_id,
        h.complaint_id,
        h.action_type,
        h.old_status,
        h.new_status,
        h.remarks,
        h.change_time,
        COALESCE(s.name,  st.name, a.name) AS changed_by_name,
        CASE
            WHEN h.changed_by_student_id IS NOT NULL THEN 'Student'
            WHEN h.changed_by_staff_id   IS NOT NULL THEN 'Staff'
            WHEN h.changed_by_admin_id   IS NOT NULL THEN 'Admin'
            ELSE 'System'
        END AS changed_by_role
    FROM History h
    LEFT JOIN Students s ON s.student_id = h.changed_by_student_id
    LEFT JOIN Staff    st ON st.staff_id  = h.changed_by_staff_id
    LEFT JOIN Admins   a ON a.admin_id   = h.changed_by_admin_id
    WHERE h.complaint_id = @ComplaintId
    ORDER BY h.change_time DESC;
END;
GO

-- Marks a complaint as a Major Incident (STAR)
CREATE OR ALTER PROCEDURE MarkAsMajorIncident
    @ComplaintId INT,
    @ResultCode  INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE Complaints SET is_major_incident = 1 WHERE complaint_id = @ComplaintId;
    SET @ResultCode = 0;
END;
GO

-- Clusters a child complaint under a major incident
CREATE OR ALTER PROCEDURE ClusterComplaint
    @ChildId  INT,
    @ParentId INT,
    @ResultCode INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    IF NOT EXISTS (SELECT 1 FROM Complaints WHERE complaint_id = @ParentId AND is_major_incident = 1)
    BEGIN
        SET @ResultCode = 1;
        RETURN;
    END
    UPDATE Complaints SET parent_complaint_id = @ParentId, status = 'In-Progress' WHERE complaint_id = @ChildId;
    SET @ResultCode = 0;
END;
GO

-- Toggles the star flag for a complaint
CREATE OR ALTER PROCEDURE ToggleComplaintStar
    @ComplaintId INT,
    @ResultCode  INT OUTPUT
AS
BEGIN
    SET NOCOUNT OFF;
    UPDATE Complaints SET is_starred = CASE WHEN is_starred = 1 THEN 0 ELSE 1 END WHERE complaint_id = @ComplaintId;
    SET @ResultCode = 0;
    SELECT is_starred AS NewStarValue FROM Complaints WHERE complaint_id = @ComplaintId;
END;
GO

-- Retrieves list of users (Student & Staff) for administration
CREATE OR ALTER PROCEDURE GetUsersAdmin
AS
BEGIN
    SET NOCOUNT ON;
    SELECT s.student_id AS id, s.name, s.email, s.phone, d.department_name, s.department_id, s.is_active, 'Student' AS role
    FROM Students s LEFT JOIN Departments d ON s.department_id = d.department_id
    UNION ALL
    SELECT st.staff_id AS id, st.name, st.email, st.phone, d.department_name, st.department_id, st.is_active, 'Staff' AS role
    FROM Staff st LEFT JOIN Departments d ON st.department_id = d.department_id
    ORDER BY role, name;
END;
GO

-- Adds a new user (Student or Staff) from admin panel
CREATE OR ALTER PROCEDURE AddUserAdmin
    @Role          VARCHAR(20),
    @Name          VARCHAR(100),
    @Email         VARCHAR(100),
    @Password      VARCHAR(255),
    @Phone         VARCHAR(20) = NULL,
    @DepartmentId  INT = NULL,
    @ResultCode    INT OUTPUT,
    @ResultMessage VARCHAR(200) OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    SET @ResultCode = 0;
    SET @ResultMessage = '';
    BEGIN TRY
        IF @Role = 'Student'
        BEGIN
            IF EXISTS (SELECT 1 FROM Students WHERE email = LOWER(LTRIM(RTRIM(@Email))))
            BEGIN
                SET @ResultCode = 1;
                SET @ResultMessage = 'Student email already exists.';
                RETURN;
            END
            INSERT INTO Students (name, email, password, phone, department_id, is_active)
            VALUES (LTRIM(RTRIM(@Name)), LOWER(LTRIM(RTRIM(@Email))), @Password, @Phone, NULLIF(@DepartmentId, 0), 1);
        END
        ELSE IF @Role = 'Staff'
        BEGIN
            IF EXISTS (SELECT 1 FROM Staff WHERE email = LOWER(LTRIM(RTRIM(@Email))))
            BEGIN
                SET @ResultCode = 1;
                SET @ResultMessage = 'Staff email already exists.';
                RETURN;
            END
            IF @DepartmentId IS NULL OR @DepartmentId = 0
            BEGIN
                SET @ResultCode = 1;
                SET @ResultMessage = 'Department is required for staff.';
                RETURN;
            END
            INSERT INTO Staff (name, email, password, phone, department_id, is_active)
            VALUES (LTRIM(RTRIM(@Name)), LOWER(LTRIM(RTRIM(@Email))), @Password, @Phone, @DepartmentId, 1);
        END
        ELSE
        BEGIN
            SET @ResultCode = 1;
            SET @ResultMessage = 'Invalid role specified.';
            RETURN;
        END
        SET @ResultCode = 0;
        SET @ResultMessage = @Role + ' added successfully.';
    END TRY
    BEGIN CATCH
        SET @ResultCode = 2;
        SET @ResultMessage = 'Error: ' + ERROR_MESSAGE();
    END CATCH
END;
GO

-- Deactivates a user account
CREATE OR ALTER PROCEDURE DeactivateUserAdmin
    @Id   INT,
    @Role VARCHAR(20),
    @ResultCode    INT OUTPUT,
    @ResultMessage VARCHAR(200) OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    SET @ResultCode = 0;
    SET @ResultMessage = '';
    BEGIN TRY
        IF @Role = 'Student'
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM Students WHERE student_id = @Id)
            BEGIN
                SET @ResultCode = 1; SET @ResultMessage = 'Student not found.'; RETURN;
            END
            UPDATE Students SET is_active = 0 WHERE student_id = @Id;
            SET @ResultMessage = 'Student deactivated successfully.';
        END
        ELSE IF @Role = 'Staff'
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM Staff WHERE staff_id = @Id)
            BEGIN
                SET @ResultCode = 1; SET @ResultMessage = 'Staff not found.'; RETURN;
            END
            UPDATE Staff SET is_active = 0 WHERE staff_id = @Id;
            SET @ResultMessage = 'Staff deactivated successfully.';
        END
        SET @ResultCode = 0;
    END TRY
    BEGIN CATCH
        SET @ResultCode = 2; SET @ResultMessage = 'Error: ' + ERROR_MESSAGE();
    END CATCH
END;
GO

-- Activates a deactivated user account
CREATE OR ALTER PROCEDURE ActivateUserAdmin
    @Id   INT,
    @Role VARCHAR(20),
    @ResultCode    INT OUTPUT,
    @ResultMessage VARCHAR(200) OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    SET @ResultCode = 0;
    SET @ResultMessage = '';
    BEGIN TRY
        IF @Role = 'Student'
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM Students WHERE student_id = @Id)
            BEGIN
                SET @ResultCode = 1; SET @ResultMessage = 'Student not found.'; RETURN;
            END
            UPDATE Students SET is_active = 1 WHERE student_id = @Id;
            SET @ResultMessage = 'Student activated successfully.';
        END
        ELSE IF @Role = 'Staff'
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM Staff WHERE staff_id = @Id)
            BEGIN
                SET @ResultCode = 1; SET @ResultMessage = 'Staff not found.'; RETURN;
            END
            UPDATE Staff SET is_active = 1 WHERE staff_id = @Id;
            SET @ResultMessage = 'Staff activated successfully.';
        END
        SET @ResultCode = 0;
    END TRY
    BEGIN CATCH
        SET @ResultCode = 2; SET @ResultMessage = 'Error: ' + ERROR_MESSAGE();
    END CATCH
END;
GO

-- Updates a department name
CREATE OR ALTER PROCEDURE UpdateDepartmentName
    @DepartmentId INT,
    @NewName VARCHAR(100),
    @ResultCode INT OUTPUT,
    @ResultMessage VARCHAR(200) OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    SET @ResultCode = 0;
    SET @ResultMessage = '';
    BEGIN TRY
        IF NOT EXISTS (SELECT 1 FROM Departments WHERE department_id = @DepartmentId)
        BEGIN
            SET @ResultCode = 1; SET @ResultMessage = 'Department not found.'; RETURN;
        END
        IF EXISTS (SELECT 1 FROM Departments WHERE department_name = @NewName AND department_id != @DepartmentId)
        BEGIN
            SET @ResultCode = 2; SET @ResultMessage = 'Department name already exists.'; RETURN;
        END
        UPDATE Departments SET department_name = @NewName WHERE department_id = @DepartmentId;
        SET @ResultCode = 0; SET @ResultMessage = 'Department updated successfully.';
    END TRY
    BEGIN CATCH
        SET @ResultCode = 3; SET @ResultMessage = 'Error: ' + ERROR_MESSAGE();
    END CATCH
END;
GO

-- Generates department-wise performance report
CREATE OR ALTER PROCEDURE GetDepartmentWiseReport
AS
BEGIN
    SET NOCOUNT ON;
    SELECT
        d.department_name,
        d.department_id,
        COUNT(c.complaint_id) AS total_complaints,
        SUM(CASE WHEN c.status = 'Resolved'    THEN 1 ELSE 0 END) AS resolved_complaints,
        SUM(CASE WHEN c.status = 'Pending'     THEN 1 ELSE 0 END) AS pending_complaints,
        SUM(CASE WHEN c.status = 'In-Progress' THEN 1 ELSE 0 END) AS in_progress_complaints,
        SUM(CASE WHEN c.status = 'Rejected'    THEN 1 ELSE 0 END) AS rejected_complaints,
        SUM(CASE WHEN c.status = 'Reopened'    THEN 1 ELSE 0 END) AS reopened_complaints,
        CAST(CASE WHEN COUNT(c.complaint_id) = 0 THEN 0.0 ELSE (SUM(CASE WHEN c.status = 'Resolved' THEN 1 ELSE 0 END) * 100.0) / COUNT(c.complaint_id) END AS DECIMAL(5,2)) AS resolution_percentage
    FROM Departments d
    LEFT JOIN Complaints c ON d.department_id = c.department_id
    GROUP BY d.department_id, d.department_name
    ORDER BY total_complaints DESC, resolution_percentage DESC;
END;
GO

-- Retrieves notifications for admin
CREATE OR ALTER PROCEDURE GetAdminNotifications
    @AdminId INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT notification_id, complaint_id, notification_type, message, is_read, created_at
    FROM Notifications WHERE admin_id = @AdminId ORDER BY created_at DESC;
END;
GO

-- Retrieves admin profile details
CREATE OR ALTER PROCEDURE GetAdminProfile
    @AdminId INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT admin_id, name, email, phone FROM Admins WHERE admin_id = @AdminId;
END;
GO

-- Updates admin profile details
CREATE OR ALTER PROCEDURE UpdateAdminProfile
    @AdminId       INT,
    @Name          VARCHAR(100),
    @Phone         VARCHAR(20),
    @Password      VARCHAR(255) = NULL,
    @ResultCode    INT OUTPUT,
    @ResultMessage VARCHAR(200) OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    SET @ResultCode = 0; SET @ResultMessage = '';
    BEGIN TRY
        IF NOT EXISTS (SELECT 1 FROM Admins WHERE admin_id = @AdminId)
        BEGIN
            SET @ResultCode = 1; SET @ResultMessage = 'Admin not found.'; RETURN;
        END
        IF @Password IS NOT NULL AND LTRIM(RTRIM(@Password)) <> ''
            UPDATE Admins SET name = LTRIM(RTRIM(@Name)), phone = LTRIM(RTRIM(@Phone)), password = @Password WHERE admin_id = @AdminId;
        ELSE
            UPDATE Admins SET name = LTRIM(RTRIM(@Name)), phone = LTRIM(RTRIM(@Phone)) WHERE admin_id = @AdminId;
        SET @ResultCode = 0; SET @ResultMessage = 'Profile updated successfully.';
    END TRY
    BEGIN CATCH
        SET @ResultCode = 2; SET @ResultMessage = 'Error: ' + ERROR_MESSAGE();
    END CATCH
END;
GO

-- Retrieves pending reopen requests for admin
CREATE OR ALTER PROCEDURE GetReopenRequests
AS
BEGIN
    SET NOCOUNT ON;
    SELECT
        c.complaint_id,
        c.title,
        c.status,
        s.name AS student_name,
        h.remarks AS reason,
        h.change_time AS requested_at
    FROM Complaints c
    JOIN Students s ON c.student_id = s.student_id
    JOIN History h ON c.complaint_id = h.complaint_id
    WHERE c.status = 'Reopen-Requested'
      AND h.action_type = 'ReopenRequest'
      AND h.history_id = (SELECT MAX(history_id) FROM History WHERE complaint_id = c.complaint_id AND action_type = 'ReopenRequest')
    ORDER BY h.change_time DESC;
END;
GO

-- Approves or rejects a reopen request
CREATE OR ALTER PROCEDURE HandleReopenRequest
    @ComplaintId INT,
    @AdminId     INT,
    @Action      VARCHAR(10),
    @ResultCode  INT OUTPUT,
    @ResultMessage VARCHAR(200) OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @NewStatus VARCHAR(20) = CASE WHEN @Action = 'Approve' THEN 'Reopened' ELSE 'Resolved' END;
    UPDATE Complaints SET status = @NewStatus WHERE complaint_id = @ComplaintId;
    INSERT INTO History (complaint_id, changed_by_admin_id, action_type, new_status, remarks)
    VALUES (@ComplaintId, @AdminId, 'StatusChange', @NewStatus, 'Reopen request ' + LOWER(@Action) + 'd by admin.');
    SET @ResultCode = 0;
    SET @ResultMessage = 'Request handled successfully.';
END;
GO

-- =============================================
-- PROCEDURES: STAFF
-- =============================================

-- Retrieves complaints assigned to a specific staff member
CREATE OR ALTER PROCEDURE GetAssignedComplaintsForStaff
    @StaffId INT,
    @Status  VARCHAR(20) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SELECT
        c.complaint_id,
        c.title,
        c.description,
        c.priority,
        c.status,
        c.submission_date,
        c.deadline,
        c.assignment_date,
        d.department_name,
        cc.category_name,
        s.name AS student_name,
        s.email AS student_email,
        CASE WHEN EXISTS (SELECT 1 FROM History h WHERE h.complaint_id = c.complaint_id AND h.changed_by_staff_id = @StaffId) THEN 0 ELSE 1 END AS is_new
    FROM Complaints c
    JOIN Departments d ON d.department_id = c.department_id
    LEFT JOIN ComplaintCategories cc ON cc.category_id = c.category_id
    JOIN Students s ON s.student_id = c.student_id
    WHERE c.assigned_to_staff_id = @StaffId AND (@Status IS NULL OR c.status = @Status)
    ORDER BY
        CASE WHEN EXISTS (SELECT 1 FROM History h WHERE h.complaint_id = c.complaint_id AND h.changed_by_staff_id = @StaffId) THEN 1 ELSE 0 END,
        c.assignment_date DESC;
END;
GO

CREATE OR ALTER PROCEDURE UpdateStaffComplaintStatus
    @ComplaintId  INT,
    @NewStatus    VARCHAR(20),
    @StaffId      INT,
    @ResultCode   INT          OUTPUT,
    @ResultMessage VARCHAR(200) OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    SET @ResultCode    = 0;
    SET @ResultMessage = '';
    BEGIN TRY
        IF @NewStatus NOT IN ('Pending', 'In-Progress', 'Resolved', 'Rejected', 'Reopened', 'Reopen-Requested')
        BEGIN
            SET @ResultCode = 1; SET @ResultMessage = 'Invalid status value.'; RETURN;
        END

        IF NOT EXISTS (SELECT 1 FROM Complaints WHERE complaint_id = @ComplaintId AND assigned_to_staff_id = @StaffId)
        BEGIN
            SET @ResultCode = 3; SET @ResultMessage = 'Unauthorized or complaint not found.'; RETURN;
        END

        BEGIN TRANSACTION;

        DECLARE @OldStatus VARCHAR(20);
        SELECT @OldStatus = status FROM Complaints WHERE complaint_id = @ComplaintId;

        -- 1. Update the main complaint status
        UPDATE Complaints SET status = @NewStatus WHERE complaint_id = @ComplaintId;

        -- 2. Log history for the main complaint
        INSERT INTO History (complaint_id, changed_by_staff_id, action_type, old_status, new_status, remarks)
        VALUES (@ComplaintId, @StaffId, 'StatusChange', @OldStatus, @NewStatus, 'Status changed from ' + @OldStatus + ' to ' + @NewStatus);

        -- 3. Notifications handled by trg_NotifyStudentOnStatusChange trigger.

        -- 4. If resolving a Major Incident, cascade the status to all linked child complaints
        IF @NewStatus IN ('Resolved', 'Rejected')
        BEGIN
            UPDATE Complaints SET status = @NewStatus WHERE parent_complaint_id = @ComplaintId;
            
            INSERT INTO History (complaint_id, changed_by_staff_id, action_type, old_status, new_status, remarks)
            SELECT complaint_id, @StaffId, 'CascadedStatusUpdate', 'In-Progress', @NewStatus, 'Automatically resolved via STAR Incident #' + CAST(@ComplaintId AS VARCHAR(10))
            FROM Complaints WHERE parent_complaint_id = @ComplaintId;

            DECLARE @ParentId INT;
            SELECT @ParentId = parent_complaint_id FROM Complaints WHERE complaint_id = @ComplaintId;
            
            IF @ParentId IS NOT NULL
            BEGIN
                UPDATE Complaints SET status = @NewStatus WHERE complaint_id = @ParentId;
                
                INSERT INTO History (complaint_id, changed_by_staff_id, action_type, old_status, new_status, remarks)
                VALUES (@ParentId, @StaffId, 'StatusChange', 'In-Progress', @NewStatus, 'Parent resolved via resolution of clustered complaint #' + CAST(@ComplaintId AS VARCHAR(10)));

                UPDATE Complaints SET status = @NewStatus WHERE parent_complaint_id = @ParentId AND complaint_id != @ComplaintId;
                
                INSERT INTO History (complaint_id, changed_by_staff_id, action_type, old_status, new_status, remarks)
                SELECT complaint_id, @StaffId, 'CascadedStatusUpdate', 'In-Progress', @NewStatus, 'Resolved via parent resolution (from sibling #' + CAST(@ComplaintId AS VARCHAR(10)) + ')'
                FROM Complaints WHERE parent_complaint_id = @ParentId AND complaint_id != @ComplaintId;
            END
        END

        COMMIT TRANSACTION;
        SET @ResultCode = 0; SET @ResultMessage = 'Status updated successfully.';
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        SET @ResultCode = 4; SET @ResultMessage = 'Error: ' + ERROR_MESSAGE();
    END CATCH
END;
GO

-- Retrieves staff profile details
CREATE OR ALTER PROCEDURE GetStaffProfile
    @StaffId INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT staff_id, name, email, phone, department_id FROM Staff WHERE staff_id = @StaffId;
END;
GO

-- Updates staff profile details
CREATE OR ALTER PROCEDURE UpdateStaffProfile
    @StaffId       INT,
    @Name          VARCHAR(100),
    @Phone         VARCHAR(20),
    @Password      VARCHAR(255) = NULL,
    @ResultCode    INT OUTPUT,
    @ResultMessage VARCHAR(200) OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    SET @ResultCode = 0; SET @ResultMessage = '';
    BEGIN TRY
        IF NOT EXISTS (SELECT 1 FROM Staff WHERE staff_id = @StaffId)
        BEGIN
            SET @ResultCode = 1; SET @ResultMessage = 'Staff member not found.'; RETURN;
        END
        IF @Password IS NOT NULL AND LTRIM(RTRIM(@Password)) <> ''
            UPDATE Staff SET name = LTRIM(RTRIM(@Name)), phone = LTRIM(RTRIM(@Phone)), password = @Password WHERE staff_id = @StaffId;
        ELSE
            UPDATE Staff SET name = LTRIM(RTRIM(@Name)), phone = LTRIM(RTRIM(@Phone)) WHERE staff_id = @StaffId;
        SET @ResultCode = 0; SET @ResultMessage = 'Profile updated successfully.';
    END TRY
    BEGIN CATCH
        SET @ResultCode = 2; SET @ResultMessage = 'Error: ' + ERROR_MESSAGE();
    END CATCH
END;
GO

-- Retrieves feedback received for a specific staff member
CREATE OR ALTER PROCEDURE GetStaffFeedback
    @StaffId INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT f.feedback_id, f.rating, f.comments, f.feedback_date, c.complaint_id, c.title AS complaint_title, s.name AS student_name
    FROM Feedback f JOIN Complaints c ON f.complaint_id = c.complaint_id JOIN Students s ON f.student_id = s.student_id
    WHERE c.assigned_to_staff_id = @StaffId ORDER BY f.feedback_date DESC;
END;
GO

-- Retrieves notifications for staff
CREATE OR ALTER PROCEDURE GetStaffNotifications
    @StaffId INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT notification_id, complaint_id, notification_type, message, is_read, created_at
    FROM Notifications WHERE staff_id = @StaffId ORDER BY created_at DESC;
END;
GO

-- Retrieves performance analytics for staff
CREATE OR ALTER PROCEDURE GetStaffAnalytics
    @StaffId INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT
        (SELECT COUNT(*) FROM Complaints WHERE assigned_to_staff_id = @StaffId) AS TotalAssigned,
        (SELECT COUNT(*) FROM Complaints WHERE assigned_to_staff_id = @StaffId AND status = 'Resolved') AS Resolved,
        (SELECT COUNT(*) FROM Complaints WHERE assigned_to_staff_id = @StaffId AND status IN ('Pending', 'In-Progress', 'Reopened')) AS Pending,
        (SELECT ISNULL(AVG(CAST(f.rating AS DECIMAL(3,2))), 0) FROM Feedback f JOIN Complaints c ON f.complaint_id = c.complaint_id WHERE c.assigned_to_staff_id = @StaffId) AS AvgRating;
END;
GO

-- Marks a notification as read
CREATE OR ALTER PROCEDURE MarkNotificationAsRead
    @NotificationId INT
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE Notifications SET is_read = 1 WHERE notification_id = @NotificationId;
END;
GO

-- =============================================
-- PROCEDURES: STUDENT
-- =============================================

-- Registers a new student account
CREATE OR ALTER PROCEDURE RegisterStudent
    @Name          VARCHAR(100),
    @Email         VARCHAR(100),
    @Password      VARCHAR(255),
    @Phone         VARCHAR(20)  = NULL,
    @DepartmentId  INT          = NULL,
    @ResultCode    INT          OUTPUT,
    @ResultMessage VARCHAR(255) OUTPUT,
    @NewStudentId  INT          OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    SET @ResultCode = 1; SET @ResultMessage = 'Internal error'; SET @NewStudentId = NULL;
    
    DECLARE @CleanEmail VARCHAR(100) = LOWER(LTRIM(RTRIM(@Email)));
    DECLARE @CleanName  VARCHAR(100) = LTRIM(RTRIM(@Name));

    BEGIN TRY
        IF (@CleanName <> '' AND @CleanEmail LIKE '%_@_%._%' AND LEN(@Password) >= 8)
        BEGIN
            IF EXISTS (SELECT 1 FROM Students WHERE email = @CleanEmail)
            BEGIN
                SET @ResultCode = 2; SET @ResultMessage = 'Error: Email already exists';
            END
            ELSE
            BEGIN
                INSERT INTO Students (name, email, password, phone, department_id, is_active)
                VALUES (@CleanName, @CleanEmail, @Password, @Phone, NULLIF(@DepartmentId, 0), 1);
                
                SET @NewStudentId = SCOPE_IDENTITY(); 
                SET @ResultCode = 0; 
                SET @ResultMessage = 'Success: Student registered successfully';
            END
        END
        ELSE
        BEGIN
            SET @ResultCode = 3; SET @ResultMessage = 'Error: Validation failed (Name required, valid email, and pass >= 8 chars)';
        END
    END TRY
    BEGIN CATCH
        SET @ResultCode = 4; SET @ResultMessage = 'Error: ' + ERROR_MESSAGE();
    END CATCH
END;
GO

-- Handles login for students and staff
CREATE OR ALTER PROCEDURE Login
    @Email         VARCHAR(100),
    @ResultCode    INT          OUTPUT,
    @ResultMessage VARCHAR(200) OUTPUT,
    @UserId        INT          OUTPUT,
    @Role          VARCHAR(20)  OUTPUT,
    @PasswordHash  VARCHAR(255) OUTPUT,
    @Name          VARCHAR(100) OUTPUT,
    @DepartmentId  INT          OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    SET @ResultCode = 1; SET @ResultMessage = 'Email not found'; SET @UserId = NULL; SET @Role = NULL; SET @PasswordHash = NULL; SET @Name = NULL; SET @DepartmentId = NULL;
    BEGIN TRY
        IF EXISTS (SELECT 1 FROM Students WHERE email = LOWER(LTRIM(RTRIM(@Email))) AND is_active = 1)
        BEGIN
            SELECT @UserId = student_id, @PasswordHash = password, @Name = name, @DepartmentId = department_id, @Role = 'Student'
            FROM Students WHERE email = LOWER(LTRIM(RTRIM(@Email))) AND is_active = 1;
            SET @ResultCode = 0; SET @ResultMessage = 'User found'; RETURN;
        END
        IF EXISTS (SELECT 1 FROM Staff WHERE email = LOWER(LTRIM(RTRIM(@Email))) AND is_active = 1)
        BEGIN
            SELECT @UserId = staff_id, @PasswordHash = password, @Name = name, @DepartmentId = department_id, @Role = 'Staff'
            FROM Staff WHERE email = LOWER(LTRIM(RTRIM(@Email))) AND is_active = 1;
            SET @ResultCode = 0; SET @ResultMessage = 'User found'; RETURN;
        END
    END TRY
    BEGIN CATCH
        SET @ResultCode = 2; SET @ResultMessage = 'Unexpected error: ' + ERROR_MESSAGE();
    END CATCH
END;
GO

-- Retrieves complaint categories
CREATE OR ALTER PROCEDURE GetComplaintCategories
    @DepartmentId INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SELECT category_id, category_name, department_id FROM ComplaintCategories WHERE @DepartmentId IS NULL OR department_id = @DepartmentId;
END;
GO

-- Transaction for Complaint Submission
-- Ensures that every new complaint is automatically recorded with its corresponding history entry.
CREATE OR ALTER PROCEDURE SubmitComplaint
    @StudentId    INT,
    @DepartmentId INT,
    @CategoryId   INT,
    @Title        VARCHAR(200),
    @Description  TEXT,
    @Priority     VARCHAR(10) = 'Medium',
    @ResultCode   INT OUTPUT,
    @ResultMessage VARCHAR(200) OUTPUT,
    @NewComplaintId INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    SET @ResultCode = 0; SET @ResultMessage = ''; SET @NewComplaintId = NULL;
    BEGIN TRY
        BEGIN TRANSACTION;

        -- 1. Create the complaint
        INSERT INTO Complaints (student_id, department_id, category_id, title, description, priority, status, submission_date)
        VALUES (@StudentId, @DepartmentId, @CategoryId, @Title, @Description, @Priority, 'Pending', GETDATE());
        
        SET @NewComplaintId = SCOPE_IDENTITY();

        -- 2. Log the initial submission in history
        INSERT INTO History (complaint_id, changed_by_student_id, action_type, remarks)
        VALUES (@NewComplaintId, @StudentId, 'StatusChange', 'Complaint submitted');

        -- 3. Admin notifications on new complaints are handled by application logic.

        COMMIT TRANSACTION;
        SET @ResultCode = 0; SET @ResultMessage = 'Complaint submitted successfully.';
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        SET @ResultCode = 2; SET @ResultMessage = 'Error: ' + ERROR_MESSAGE();
    END CATCH
END;

select * from History;
select * from Students
where student_id = 4;

select * from Complaints
where student_id=4;

-- Retrieves dashboard statistics for a specific student
CREATE OR ALTER PROCEDURE GetStudentDashboardStats
    @StudentId INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT
        (SELECT COUNT(*) FROM Complaints WHERE student_id = @StudentId) AS TotalComplaints,
        (SELECT COUNT(*) FROM Complaints WHERE student_id = @StudentId AND status = 'Pending') AS Pending,
        (SELECT COUNT(*) FROM Complaints WHERE student_id = @StudentId AND status IN ('In-Progress', 'Resolved', 'Reopened')) AS InProgress,
        (SELECT COUNT(*) FROM Complaints WHERE student_id = @StudentId AND status = 'Resolved') AS Resolved;
END;
GO

-- Retrieves all complaints submitted by a student
CREATE OR ALTER PROCEDURE GetStudentComplaints
    @StudentId INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT c.complaint_id, c.title, c.description, c.priority, c.status, c.submission_date, c.deadline, c.assignment_date, d.department_name, c.department_id, cc.category_name, st.name AS assigned_to_staff_name
    FROM Complaints c JOIN Departments d ON d.department_id = c.department_id LEFT JOIN ComplaintCategories cc ON cc.category_id = c.category_id LEFT JOIN Staff st ON st.staff_id = c.assigned_to_staff_id
    WHERE c.student_id = @StudentId ORDER BY c.submission_date DESC;
END;
GO

-- Submits a request to reopen a resolved complaint
CREATE OR ALTER PROCEDURE RequestReopenComplaint
    @ComplaintId INT,
    @StudentId   INT,
    @Remarks     VARCHAR(MAX),
    @ResultCode  INT OUTPUT,
    @ResultMessage VARCHAR(200) OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE Complaints SET status = 'Reopen-Requested' WHERE complaint_id = @ComplaintId;
    INSERT INTO History (complaint_id, changed_by_student_id, action_type, remarks)
    VALUES (@ComplaintId, @StudentId, 'ReopenRequest', @Remarks);
    SET @ResultCode = 0; SET @ResultMessage = 'Reopen request submitted.';
END;
GO

-- Submits feedback/rating for a resolved complaint
CREATE OR ALTER PROCEDURE SubmitFeedback
    @ComplaintId INT,
    @StudentId   INT,
    @Rating      INT,
    @Comments    TEXT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        INSERT INTO Feedback (complaint_id, student_id, rating, comments) VALUES (@ComplaintId, @StudentId, @Rating, @Comments);
        DECLARE @StaffId INT; DECLARE @Title VARCHAR(200);
        SELECT @StaffId = assigned_to_staff_id, @Title = title FROM Complaints WHERE complaint_id = @ComplaintId;
        IF @StaffId IS NOT NULL
            INSERT INTO Notifications (complaint_id, staff_id, notification_type, message) VALUES (@ComplaintId, @StaffId, 'Feedback', 'New feedback received for: ' + @Title);
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END;
GO

-- Retrieves notifications for student
CREATE OR ALTER PROCEDURE GetStudentNotifications
    @StudentId INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT notification_id, complaint_id, notification_type, message, is_read, created_at
    FROM Notifications WHERE student_id = @StudentId ORDER BY created_at DESC;
END;
GO

-- Retrieves student profile details
CREATE OR ALTER PROCEDURE GetStudentProfile
    @StudentId INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT s.student_id, s.name, s.email, s.phone, d.department_name, s.department_id, s.created_at
    FROM Students s LEFT JOIN Departments d ON s.department_id = d.department_id WHERE s.student_id = @StudentId;
END;
GO

-- Updates student profile details
CREATE OR ALTER PROCEDURE UpdateStudentProfile
    @StudentId    INT,
    @Name         VARCHAR(100),
    @PhoneNumber  VARCHAR(20),
    @PasswordHash VARCHAR(255) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE Students SET name = @Name, phone = @PhoneNumber, password = ISNULL(@PasswordHash, password) WHERE student_id = @StudentId;
END;
GO

-- =============================================
-- INSERTIONS
-- =============================================

INSERT INTO Departments (department_name) VALUES
('Computer Science'),
('Electrical Engineering'),
('Mechanical Engineering'),
('Business Administration'),
('Humanities');

INSERT INTO Admins (name, email, password, phone) VALUES
('Admin', 'admin@university.edu', 'admin123', '03000000000');

INSERT INTO Staff (name, email, password, phone, department_id) VALUES
('Dr. Hassan', 'hassan@uni.edu', 'pass1234', '03001112222', 1),
('Engr. Bilal', 'bilal@uni.edu', 'pass1234', '03003334444', 2);

INSERT INTO ComplaintCategories (category_name, department_id) VALUES
('Internet Issue', 1),
('Lab Equipment', 1),
('Software License Issue', 1),
('Printer Problems', 1),
('Database Access', 1),
('Server Downtime', 1),
('WiFi Connectivity', 1),
('Power Failure', 2);
GO


-- VIEWS
--ADMIN
--Replaces the GetComplaintsForAdmin SP joins.
--Backend queries this view with dynamic WHERE clauses.
CREATE VIEW v_AdminComplaintOverview AS
SELECT
    c.complaint_id,
    c.title,
    c.description,
    c.status,
    c.priority,
    c.is_starred,
    c.is_major_incident,
    c.submission_date,
    c.student_id,
    c.department_id,
    c.category_id,
    c.assigned_to_staff_id AS staff_id,
    c.parent_complaint_id,
    s.name              AS student_name,
    s.email             AS student_email,
    d.department_name,
    cat.category_name,
    st.name             AS assigned_to_staff_name
FROM Complaints c
LEFT JOIN Students            s   ON c.student_id   = s.student_id
LEFT JOIN Departments         d   ON c.department_id = d.department_id
LEFT JOIN ComplaintCategories cat ON c.category_id  = cat.category_id
LEFT JOIN Staff               st  ON c.assigned_to_staff_id = st.staff_id;
GO

--STUDENT
--Gives each student a clean read of their own complaints
--with resolved names instead of foreign key IDs.
--Backend filters by student_id at query time.
CREATE VIEW v_StudentComplaintStatus AS
SELECT
    c.complaint_id,
    c.student_id,
    c.title,
    c.status,
    c.priority,
    c.submission_date,
    d.department_name,
    cat.category_name
FROM Complaints c
LEFT JOIN Departments         d   ON c.department_id = d.department_id
LEFT JOIN ComplaintCategories cat ON c.category_id  = cat.category_id;
GO

-- [STAFF] v_StaffAssignedComplaints
-- Gives each staff member a rich view of their assigned
-- complaints including student contact info and deadlines.
-- Backend filters by staff_id at query time.
CREATE VIEW v_StaffAssignedComplaints AS
SELECT
    c.complaint_id,
    c.assigned_to_staff_id AS staff_id,
    c.title,
    c.description,
    c.status,
    c.priority,
    c.submission_date,
    c.assignment_date,
    c.deadline,
    -- Flag a complaint as NEW if assigned within the last 24 hours
    CASE WHEN DATEDIFF(HOUR, c.assignment_date, GETDATE()) < 24 THEN 1 ELSE 0 END AS is_new,
    s.name              AS student_name,
    s.email             AS student_email,
    d.department_name,
    cat.category_name
FROM Complaints c
JOIN Students             s   ON c.student_id   = s.student_id
LEFT JOIN Departments     d   ON c.department_id = d.department_id
LEFT JOIN ComplaintCategories cat ON c.category_id = cat.category_id
WHERE c.assigned_to_staff_id IS NOT NULL;
GO



-- TRIGGERS
--ADMIN
--Fires after INSERT into the Complaints status = 'Reopen-Requested'.
--Automatically notifies ALL admins.
CREATE TRIGGER trg_AutoNotifyAdminOnReopen
ON Complaints
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    IF UPDATE(status)
    BEGIN
        INSERT INTO Notifications (complaint_id, admin_id, notification_type, message)
        SELECT
            i.complaint_id,
            a.admin_id,
            'ReopenRequest',
            'Reopen request for Complaint #' + CAST(i.complaint_id AS VARCHAR(10))
                + ' by student: ' + ISNULL(s.name, 'Unknown')
        FROM inserted i
        JOIN deleted  d ON i.complaint_id = d.complaint_id
        JOIN Students s ON i.student_id   = s.student_id
        CROSS JOIN Admins a
        WHERE i.status = 'Reopen-Requested'
          AND d.status <> 'Reopen-Requested';
    END
END;
GO

--STUDENT
--Fires whenever a complaint status changes.
--Automatically notifies the owning student.
CREATE TRIGGER trg_NotifyStudentOnStatusChange
ON Complaints
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    IF UPDATE(status)
    BEGIN
        INSERT INTO Notifications (complaint_id, student_id, notification_type, message)
        SELECT
            i.complaint_id,
            i.student_id,
            'StatusUpdate',
            'Your complaint #' + CAST(i.complaint_id AS VARCHAR(10))
                + ' status changed to: ' + i.status
        FROM inserted i
        JOIN deleted d ON i.complaint_id = d.complaint_id
        WHERE i.status <> d.status
          AND i.status <> 'Reopen-Requested'; -- exclude reopen requests (handled by admin trigger)
    END
END;
GO
-- staff 
--Fires whenever a complaint is assigned to a staff member.
--Automatically notifies the assigned staff member.
CREATE TRIGGER trg_NotifyStaffOnAssignment
ON Complaints
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    IF UPDATE(assigned_to_staff_id)
    BEGIN
        INSERT INTO Notifications (complaint_id, staff_id, notification_type, message)
        SELECT
            i.complaint_id,
            i.assigned_to_staff_id,
            'Assigned',
            'A complaint has been assigned to you: #'
                + CAST(i.complaint_id AS VARCHAR(10)) + ' - ' + i.title
        FROM inserted i
        JOIN deleted d ON i.complaint_id = d.complaint_id
        WHERE i.assigned_to_staff_id IS NOT NULL
          AND (d.assigned_to_staff_id IS NULL OR i.assigned_to_staff_id <> d.assigned_to_staff_id);
    END
END;
GO

--automatically notifies the admin on any compaint submission
CREATE TRIGGER trg_AutoNotifyAdminOnSubmission
ON Complaints
AFTER INSERT
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO Notifications (complaint_id, admin_id, notification_type, message)
    SELECT
        i.complaint_id,
        a.admin_id,
        'Submitted',
        'New complaint submitted: #' + CAST(i.complaint_id AS VARCHAR(10)) + ' - ' + i.title
    FROM inserted i
    CROSS JOIN Admins a;
END;
GO
