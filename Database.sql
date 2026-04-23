CREATE DATABASE UniversityHelpdeskDB;
GO
USE UniversityHelpdeskDB
GO
CREATE TABLE Departments
(
    department_id   INT          IDENTITY(1,1) PRIMARY KEY,
    department_name VARCHAR(100) NOT NULL UNIQUE
);
CREATE TABLE Admins
(
    admin_id    INT          IDENTITY(1,1) PRIMARY KEY,
    name        VARCHAR(100) NOT NULL,
    email       VARCHAR(100) NOT NULL UNIQUE,
    password    VARCHAR(255) NOT NULL,
    phone       VARCHAR(20),
    created_at  DATETIME     DEFAULT GETDATE()
);
CREATE TABLE Staff
(
    staff_id      INT          IDENTITY(1,1) PRIMARY KEY,
    name          VARCHAR(100) NOT NULL,
    email         VARCHAR(100) NOT NULL UNIQUE,
    password      VARCHAR(255) NOT NULL,
    phone         VARCHAR(20),
    department_id INT          NOT NULL,
    created_at    DATETIME     DEFAULT GETDATE(),
    is_active BIT NOT NULL DEFAULT 1,
    FOREIGN KEY (department_id) REFERENCES Departments(department_id)
);
CREATE TABLE Students
(
    student_id    INT          IDENTITY(1,1) PRIMARY KEY,
    name          VARCHAR(100) NOT NULL,
    email         VARCHAR(100) NOT NULL UNIQUE,
    password      VARCHAR(255) NOT NULL,
    phone         VARCHAR(20),
    department_id INT          NULL,
    created_at    DATETIME     DEFAULT GETDATE(),
    is_active BIT NOT NULL DEFAULT 1,
    FOREIGN KEY (department_id) REFERENCES Departments(department_id)
);
CREATE TABLE ComplaintCategories
(
    category_id   INT          IDENTITY(1,1) PRIMARY KEY,
    category_name VARCHAR(100) NOT NULL,
    department_id INT,

    FOREIGN KEY (department_id) REFERENCES Departments(department_id)
);
CREATE TABLE Complaints
(
    complaint_id          INT          IDENTITY(1,1) PRIMARY KEY,
    student_id            INT          NOT NULL,
    department_id         INT          NOT NULL,
    category_id           INT,
    title                 VARCHAR(200),
    description           TEXT,
    priority              VARCHAR(10)  NOT NULL DEFAULT 'Medium' CHECK (priority IN ('Low', 'Medium', 'High')),
    status                VARCHAR(20)  NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'In-Progress', 'Resolved', 'Rejected', 'Reopened')),
    -- assignment columns replace ComplaintAssignments table
    assigned_to_staff_id  INT          NULL,
    assigned_by_admin_id  INT          NULL,
    assignment_date       DATETIME     NULL,
    submission_date       DATETIME     DEFAULT GETDATE(),
    deadline              DATETIME,
    FOREIGN KEY (student_id)           REFERENCES Students(student_id),
    FOREIGN KEY (department_id)        REFERENCES Departments(department_id),
    FOREIGN KEY (category_id)          REFERENCES ComplaintCategories(category_id),
    FOREIGN KEY (assigned_to_staff_id) REFERENCES Staff(staff_id),
    FOREIGN KEY (assigned_by_admin_id) REFERENCES Admins(admin_id)
);
CREATE TABLE History
(
    history_id   INT          IDENTITY(1,1) PRIMARY KEY,
    complaint_id INT          NOT NULL,
    changed_by_student_id INT NULL,
    changed_by_staff_id   INT NULL,
    changed_by_admin_id   INT NULL,
    action_type  VARCHAR(30)  NOT NULLCHECK (action_type IN ('StatusChange', 'Assignment', 'ReopenRequest', 'Escalation', 'Note')),
    old_status   VARCHAR(20),
    new_status   VARCHAR(20),
    remarks      TEXT,
    change_time  DATETIME     DEFAULT GETDATE(),
    FOREIGN KEY (complaint_id)          REFERENCES Complaints(complaint_id),
    FOREIGN KEY (changed_by_student_id) REFERENCES Students(student_id),
    FOREIGN KEY (changed_by_staff_id)   REFERENCES Staff(staff_id),
    FOREIGN KEY (changed_by_admin_id)   REFERENCES Admins(admin_id)
);
CREATE TABLE Feedback
(
    feedback_id   INT      IDENTITY(1,1) PRIMARY KEY,
    complaint_id  INT      NOT NULL UNIQUE,
    student_id    INT      NOT NULL,
    rating        INT      CHECK (rating BETWEEN 1 AND 5),
    comments      TEXT,
    feedback_date DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (complaint_id) REFERENCES Complaints(complaint_id),
    FOREIGN KEY (student_id)   REFERENCES Students(student_id)
);
--  COMPLAINT ATTACHMENTS
CREATE TABLE ComplaintAttachments
(
    attachment_id INT          IDENTITY(1,1) PRIMARY KEY,
    complaint_id  INT          NOT NULL,
    file_path     VARCHAR(255),
    upload_date   DATETIME     DEFAULT GETDATE(),

    FOREIGN KEY (complaint_id) REFERENCES Complaints(complaint_id)
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
    created_at DATETIME    DEFAULT GETDATE(),
    FOREIGN KEY (complaint_id) REFERENCES Complaints(complaint_id),
    FOREIGN KEY (student_id)   REFERENCES Students(student_id),
    FOREIGN KEY (staff_id)     REFERENCES Staff(staff_id),
    FOREIGN KEY (admin_id)     REFERENCES Admins(admin_id)
);
GO
CREATE PROCEDURE RegisterStudent
    @Name          VARCHAR(100),
    @Email         VARCHAR(100),
    @Password      VARCHAR(255),
    @Phone         VARCHAR(20)  = NULL,     -- optional
    @DepartmentId  INT          = NULL,     -- optional
    @ResultCode    INT          OUTPUT,
    @ResultMessage VARCHAR(255) OUTPUT,
    @NewStudentId  INT          OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
 
    SET @ResultCode    = 0;
    SET @ResultMessage = '';
    SET @NewStudentId  = NULL;
 
    BEGIN TRY
 
        IF (
            @Name     IS NOT NULL AND LTRIM(RTRIM(@Name))  <> '' AND @Name  LIKE '[A-Za-z]%' AND
            @Email    IS NOT NULL AND LTRIM(RTRIM(@Email))  <> '' AND @Email LIKE '%_@_%._%'  AND
            @Password IS NOT NULL AND LEN(@Password) BETWEEN 8 AND 255 AND
            (@Phone IS NULL OR (LEN(@Phone) = 11 AND @Phone LIKE '%[0-9]%'))
        )
        BEGIN
            IF EXISTS (SELECT 1 FROM Students WHERE email = @Email)
            BEGIN
                SET @ResultCode    = 0
                SET @ResultMessage = 'Error: Email already exists'
                SET @NewStudentId  = NULL
            END
            ELSE
            BEGIN
                INSERT INTO Students (name, email, password, phone, department_id)
                VALUES (
                    LTRIM(RTRIM(@Name)),
                    LOWER(LTRIM(RTRIM(@Email))),
                    @Password,
                    @Phone,
                    NULLIF(@DepartmentId, 0)
                )
 
                SET @NewStudentId  = SCOPE_IDENTITY()
                SET @ResultCode    = 1
                SET @ResultMessage = 'Success: Student registered successfully'
            END
        END
        ELSE
        BEGIN
            SET @ResultCode    = 0
            SET @ResultMessage = 'Error: Validation failed'
            SET @NewStudentId  = NULL
        END
 
    END TRY
    BEGIN CATCH
        SET @ResultCode    = 0
        SET @ResultMessage = 'Error: ' + ERROR_MESSAGE()
        SET @NewStudentId  = NULL
    END CATCH
 
END;
GO
CREATE PROCEDURE Login
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
 
    SET @ResultCode    = 1;
    SET @ResultMessage = 'Email not found';
    SET @UserId        = NULL;
    SET @Role          = NULL;
    SET @PasswordHash  = NULL;
    SET @Name          = NULL;
    SET @DepartmentId  = NULL;
 
    BEGIN TRY
 
        --1. Check Students table first 
        IF EXISTS (SELECT 1 FROM Students WHERE email = LOWER(LTRIM(RTRIM(@Email))) AND is_active = 1)
        BEGIN
            SELECT
                @UserId       = student_id,
                @PasswordHash = password,
                @Name         = name,
                @DepartmentId = department_id,
                @Role         = 'Student'
            FROM Students
            WHERE email = LOWER(LTRIM(RTRIM(@Email))) AND is_active = 1;
 
            SET @ResultCode    = 0;
            SET @ResultMessage = 'User found';
            RETURN;
        END
 
        --2. Check Staff table 
        IF EXISTS (SELECT 1 FROM Staff WHERE email = LOWER(LTRIM(RTRIM(@Email))) AND is_active = 1)
        BEGIN
            SELECT
                @UserId       = staff_id,
                @PasswordHash = password,
                @Name         = name,
                @DepartmentId = department_id,
                @Role         = 'Staff'
            FROM Staff
            WHERE email = LOWER(LTRIM(RTRIM(@Email))) AND is_active = 1;
 
            SET @ResultCode    = 0;
            SET @ResultMessage = 'User found';
            RETURN;
        END
        --3. Email not found in either table
        SET @ResultCode    = 1;
        SET @ResultMessage = 'Invalid email or password';
 
    END TRY
    BEGIN CATCH
        SET @ResultCode    = 2;
        SET @ResultMessage = 'Unexpected error: ' + ERROR_MESSAGE();
    END CATCH
 
END;
GO

CREATE PROCEDURE AdminLogin
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
            SELECT
                @AdminId      = admin_id,
                @PasswordHash = password,
                @Name         = name
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
INSERT INTO Admins (name, email, password, phone)
VALUES (
    'Admin',
    'admin@university.edu',
    'admin123',
    '03000000000'
);
GO
--Admin Page Functionalities
CREATE OR ALTER PROCEDURE GetComplaintsForAdmin
    @Filter       VARCHAR(20)  = 'all',   -- 'all' | 'unassigned' | 'assigned'
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

        -- Department
        d.department_name,
        c.department_id,

        -- Category
        cc.category_name,

        -- Student
        s.name         AS student_name,
        s.email        AS student_email,

        -- Assigned staff (NULL when unassigned)
        st.name        AS assigned_to_staff_name,
        st.email       AS assigned_to_staff_email,

        -- Assigned by (admin)
        a.name         AS assigned_by_admin_name,

        -- Unseen flag: 1 if no History rows exist for this complaint
        CASE WHEN EXISTS (
            SELECT 1 FROM History h WHERE h.complaint_id = c.complaint_id
        ) THEN 0 ELSE 1 END  AS is_new

    FROM Complaints c
    JOIN  Departments        d  ON d.department_id  = c.department_id
    LEFT JOIN ComplaintCategories cc ON cc.category_id = c.category_id
    JOIN  Students           s  ON s.student_id     = c.student_id
    LEFT JOIN Staff          st ON st.staff_id       = c.assigned_to_staff_id
    LEFT JOIN Admins         a  ON a.admin_id        = c.assigned_by_admin_id

    WHERE
        -- Tab filter
        (
            @Filter = 'all'
            OR (@Filter = 'unassigned' AND c.assigned_to_staff_id IS NULL)
            OR (@Filter = 'assigned'   AND c.assigned_to_staff_id IS NOT NULL)
        )
        -- Department filter (only for assigned tab but we apply globally when given)
        AND (@DepartmentId IS NULL OR c.department_id = @DepartmentId)
        -- Priority filter
        AND (@Priority IS NULL OR c.priority = @Priority)

    ORDER BY
        -- Unseen complaints first, then by submission date descending
        CASE WHEN EXISTS (
            SELECT 1 FROM History h WHERE h.complaint_id = c.complaint_id
        ) THEN 1 ELSE 0 END,
        c.submission_date DESC;
END;
GO

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
            SET @ResultCode = 1;
            SET @ResultMessage = 'Department not found.';
            RETURN;
        END

        IF EXISTS (SELECT 1 FROM Departments WHERE department_name = @NewName AND department_id != @DepartmentId)
        BEGIN
            SET @ResultCode = 2;
            SET @ResultMessage = 'Department name already exists.';
            RETURN;
        END

        UPDATE Departments
        SET department_name = @NewName
        WHERE department_id = @DepartmentId;

        SET @ResultCode = 0;
        SET @ResultMessage = 'Department updated successfully.';
    END TRY
    BEGIN CATCH
        SET @ResultCode = 4;
        SET @ResultMessage = 'Error: ' + ERROR_MESSAGE();
    END CATCH
END;
GO

CREATE OR ALTER PROCEDURE GetStaffFeedback
    @StaffId INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT 
        f.feedback_id,
        f.rating,
        f.comments,
        f.feedback_date,
        c.complaint_id,
        c.title AS complaint_title,
        s.name AS student_name
    FROM Feedback f
    JOIN Complaints c ON f.complaint_id = c.complaint_id
    JOIN Students s ON f.student_id = s.student_id
    WHERE c.assigned_to_staff_id = @StaffId
    ORDER BY f.feedback_date DESC;
END;
GO


CREATE OR ALTER PROCEDURE UpdateComplaintPriority
    @ComplaintId  INT,
    @NewPriority  VARCHAR(10),      -- 'Low' | 'Medium' | 'High'
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

        UPDATE Complaints
        SET priority = @NewPriority
        WHERE complaint_id = @ComplaintId;

        -- Log to History
        INSERT INTO History (complaint_id, changed_by_admin_id, action_type, remarks)
        VALUES (
            @ComplaintId,
            @AdminId,
            'Note',
            'Priority changed from ' + @OldPriority + ' to ' + @NewPriority
        );

        SET @ResultCode    = 0;
        SET @ResultMessage = 'Priority updated successfully.';
    END TRY
    BEGIN CATCH
        SET @ResultCode    = 3;
        SET @ResultMessage = 'Error: ' + ERROR_MESSAGE();
    END CATCH
END;
GO

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

        -- Who made the change (only one will be non-NULL)
        COALESCE(s.name,  st.name, a.name) AS changed_by_name,
        CASE
            WHEN h.changed_by_student_id IS NOT NULL THEN 'Student'
            WHEN h.changed_by_staff_id   IS NOT NULL THEN 'Staff'
            WHEN h.changed_by_admin_id   IS NOT NULL THEN 'Admin'
            ELSE 'System'
        END AS changed_by_role

    FROM History h
    LEFT JOIN Students s  ON s.student_id = h.changed_by_student_id
    LEFT JOIN Staff    st ON st.staff_id  = h.changed_by_staff_id
    LEFT JOIN Admins   a  ON a.admin_id   = h.changed_by_admin_id

    WHERE h.complaint_id = @ComplaintId
    ORDER BY h.change_time DESC;
END;
GO

CREATE OR ALTER PROCEDURE UpdateComplaintStatus
    @ComplaintId  INT,
    @NewStatus    VARCHAR(20),      -- 'Pending', 'In-Progress', 'Resolved', 'Rejected', 'Reopened'
    @AdminId      INT,
    @ResultCode   INT          OUTPUT,
    @ResultMessage VARCHAR(200) OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    SET @ResultCode    = 0;
    SET @ResultMessage = '';

    BEGIN TRY
        IF @NewStatus NOT IN ('Pending', 'In-Progress', 'Resolved', 'Rejected', 'Reopened')
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

        DECLARE @OldStatus VARCHAR(20);
        SELECT @OldStatus = status FROM Complaints WHERE complaint_id = @ComplaintId;

        UPDATE Complaints
        SET status = @NewStatus
        WHERE complaint_id = @ComplaintId;

        -- Log to History
        INSERT INTO History (complaint_id, changed_by_admin_id, action_type, old_status, new_status, remarks)
        VALUES (
            @ComplaintId,
            @AdminId,
            'StatusChange',
            @OldStatus,
            @NewStatus,
            'Status changed from ' + @OldStatus + ' to ' + @NewStatus
        );

        SET @ResultCode    = 0;
        SET @ResultMessage = 'Status updated successfully.';
    END TRY
    BEGIN CATCH
        SET @ResultCode    = 3;
        SET @ResultMessage = 'Error: ' + ERROR_MESSAGE();
    END CATCH
END;
GO

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
        
        CAST(
            CASE 
                WHEN COUNT(c.complaint_id) = 0 THEN 0.0
                ELSE (SUM(CASE WHEN c.status = 'Resolved' THEN 1 ELSE 0 END) * 100.0) / COUNT(c.complaint_id)
            END 
        AS DECIMAL(5,2)) AS resolution_percentage

    FROM Departments d
    LEFT JOIN Complaints c ON d.department_id = c.department_id
    GROUP BY d.department_id, d.department_name
    ORDER BY total_complaints DESC, resolution_percentage DESC;
END;
GO



--DUMMY VALUES
INSERT INTO Departments (department_name)
VALUES 
('Computer Science'),
('Electrical Engineering'),
('Mechanical Engineering'),
('Business Administration'),
('Humanities');

INSERT INTO Students (name, email, password, phone, department_id)
VALUES
('Ali Khan', 'ali@uni.edu', 'pass1234', '03001234567', 1),
('Sara Ahmed', 'sara@uni.edu', 'pass1234', '03007654321', 2),
('Usman Tariq', 'usman@uni.edu', 'pass1234', '03111222333', 1);

INSERT INTO Staff (name, email, password, phone, department_id)
VALUES
('Dr. Hassan', 'hassan@uni.edu', 'pass1234', '03001112222', 1),
('Engr. Bilal', 'bilal@uni.edu', 'pass1234', '03003334444', 2);

INSERT INTO ComplaintCategories (category_name, department_id)
VALUES
('Internet Issue', 1),
('Lab Equipment', 1),
('Power Failure', 2),
('Course Registration', 4);

INSERT INTO Complaints
(student_id, department_id, category_id, title, description, priority, status, assigned_to_staff_id, assigned_by_admin_id, assignment_date, deadline)
VALUES

-- Unassigned (NEW)
(1, 1, 1, 'WiFi not working', 'Internet is down in lab', 'High', 'Pending', NULL, NULL, NULL, DATEADD(DAY, 3, GETDATE())),

-- Assigned complaint
(2, 2, 3, 'Power outage', 'Frequent power failures', 'Medium', 'In-Progress', 2, 1, GETDATE(), DATEADD(DAY, 5, GETDATE())),

-- Resolved complaint
(3, 1, 2, 'Broken PC', 'Computer not turning on', 'Low', 'Resolved', 1, 1, GETDATE(), DATEADD(DAY, 2, GETDATE())),

-- Another unassigned
(1, 4, 4, 'Registration issue', 'Cannot enroll in course', 'High', 'Pending', NULL, NULL, NULL, DATEADD(DAY, 4, GETDATE()));

INSERT INTO History (complaint_id, changed_by_admin_id, action_type, old_status, new_status, remarks)
VALUES
(2, 1, 'StatusChange', 'Pending', 'In-Progress', 'Assigned to staff'),
(3, 1, 'StatusChange', 'In-Progress', 'Resolved', 'Issue fixed');
GO

CREATE OR ALTER PROCEDURE GetUsersAdmin
AS
BEGIN
    SET NOCOUNT ON;

    -- Students
    SELECT
        s.student_id AS id,
        s.name,
        s.email,
        s.phone,
        d.department_name,
        s.department_id,
        s.is_active,
        'Student' AS role
    FROM Students s
    LEFT JOIN Departments d ON s.department_id = d.department_id

    UNION ALL

    -- Staff
    SELECT
        st.staff_id AS id,
        st.name,
        st.email,
        st.phone,
        d.department_name,
        st.department_id,
        st.is_active,
        'Staff' AS role
    FROM Staff st
    LEFT JOIN Departments d ON st.department_id = d.department_id

    ORDER BY role, name;
END;
GO

CREATE OR ALTER PROCEDURE AddUserAdmin
    @Role          VARCHAR(20), -- 'Student' or 'Staff'
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

CREATE OR ALTER PROCEDURE DeactivateUserAdmin
    @Id   INT,
    @Role VARCHAR(20), -- 'Student' or 'Staff'
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
                SET @ResultCode = 1;
                SET @ResultMessage = 'Student not found.';
                RETURN;
            END

            UPDATE Students SET is_active = 0 WHERE student_id = @Id;
            SET @ResultMessage = 'Student deactivated successfully.';
        END
        ELSE IF @Role = 'Staff'
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM Staff WHERE staff_id = @Id)
            BEGIN
                SET @ResultCode = 1;
                SET @ResultMessage = 'Staff not found.';
                RETURN;
            END

            UPDATE Staff SET is_active = 0 WHERE staff_id = @Id;
            SET @ResultMessage = 'Staff deactivated successfully.';
        END
        ELSE
        BEGIN
            SET @ResultCode = 1;
            SET @ResultMessage = 'Invalid role specified.';
            RETURN;
        END

        SET @ResultCode = 0;
    END TRY
    BEGIN CATCH
        SET @ResultCode = 2;
        SET @ResultMessage = 'Error: ' + ERROR_MESSAGE();
    END CATCH
END;
GO

CREATE OR ALTER PROCEDURE ActivateUserAdmin
    @Id   INT,
    @Role VARCHAR(20), -- 'Student' or 'Staff'
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
                SET @ResultCode = 1;
                SET @ResultMessage = 'Student not found.';
                RETURN;
            END

            UPDATE Students SET is_active = 1 WHERE student_id = @Id;
            SET @ResultMessage = 'Student activated successfully.';
        END
        ELSE IF @Role = 'Staff'
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM Staff WHERE staff_id = @Id)
            BEGIN
                SET @ResultCode = 1;
                SET @ResultMessage = 'Staff not found.';
                RETURN;
            END

            UPDATE Staff SET is_active = 1 WHERE staff_id = @Id;
            SET @ResultMessage = 'Staff activated successfully.';
        END
        ELSE
        BEGIN
            SET @ResultCode = 1;
            SET @ResultMessage = 'Invalid role specified.';
            RETURN;
        END

        SET @ResultCode = 0;
    END TRY
    BEGIN CATCH
        SET @ResultCode = 2;
        SET @ResultMessage = 'Error: ' + ERROR_MESSAGE();
    END CATCH
END;
GO

CREATE OR ALTER PROCEDURE GetAdminProfile
    @AdminId INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT admin_id, name, email, phone
    FROM Admins
    WHERE admin_id = @AdminId;
END;
GO

CREATE OR ALTER PROCEDURE UpdateAdminProfile
    @AdminId       INT,
    @Name          VARCHAR(100),
    @Phone         VARCHAR(20),
    @Password      VARCHAR(255) = NULL, -- Optional password update
    @ResultCode    INT OUTPUT,
    @ResultMessage VARCHAR(200) OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    SET @ResultCode = 0;
    SET @ResultMessage = '';

    BEGIN TRY
        IF NOT EXISTS (SELECT 1 FROM Admins WHERE admin_id = @AdminId)
        BEGIN
            SET @ResultCode = 1;
            SET @ResultMessage = 'Admin not found.';
            RETURN;
        END

        IF @Password IS NOT NULL AND LTRIM(RTRIM(@Password)) <> ''
        BEGIN
            UPDATE Admins
            SET name = LTRIM(RTRIM(@Name)),
                phone = LTRIM(RTRIM(@Phone)),
                password = @Password
            WHERE admin_id = @AdminId;
        END
        ELSE
        BEGIN
            UPDATE Admins
            SET name = LTRIM(RTRIM(@Name)),
                phone = LTRIM(RTRIM(@Phone))
            WHERE admin_id = @AdminId;
        END

        SET @ResultCode = 0;
        SET @ResultMessage = 'Profile updated successfully.';
    END TRY
    BEGIN CATCH
        SET @ResultCode = 2;
        SET @ResultMessage = 'Error: ' + ERROR_MESSAGE();
    END CATCH
END;
GO

CREATE OR ALTER PROCEDURE GetStaffProfile
    @StaffId INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT staff_id, name, email, phone, department_id
    FROM Staff
    WHERE staff_id = @StaffId;
END;
GO

CREATE OR ALTER PROCEDURE UpdateStaffProfile
    @StaffId       INT,
    @Name          VARCHAR(100),
    @Phone         VARCHAR(20),
    @Password      VARCHAR(255) = NULL, -- Optional password update
    @ResultCode    INT OUTPUT,
    @ResultMessage VARCHAR(200) OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    SET @ResultCode = 0;
    SET @ResultMessage = '';

    BEGIN TRY
        IF NOT EXISTS (SELECT 1 FROM Staff WHERE staff_id = @StaffId)
        BEGIN
            SET @ResultCode = 1;
            SET @ResultMessage = 'Staff member not found.';
            RETURN;
        END

        IF @Password IS NOT NULL AND LTRIM(RTRIM(@Password)) <> ''
        BEGIN
            UPDATE Staff
            SET name = LTRIM(RTRIM(@Name)),
                phone = LTRIM(RTRIM(@Phone)),
                password = @Password
            WHERE staff_id = @StaffId;
        END
        ELSE
        BEGIN
            UPDATE Staff
            SET name = LTRIM(RTRIM(@Name)),
                phone = LTRIM(RTRIM(@Phone))
            WHERE staff_id = @StaffId;
        END

        SET @ResultCode = 0;
        SET @ResultMessage = 'Profile updated successfully.';
    END TRY
    BEGIN CATCH
        SET @ResultCode = 2;
        SET @ResultMessage = 'Error: ' + ERROR_MESSAGE();
    END CATCH
END;
GO

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

        -- Department
        d.department_name,

        -- Category
        cc.category_name,

        -- Student
        s.name         AS student_name,
        s.email        AS student_email,

        -- Unseen flag for staff
        CASE WHEN EXISTS (
            SELECT 1 FROM History h 
            WHERE h.complaint_id = c.complaint_id 
              AND h.changed_by_staff_id = @StaffId
        ) THEN 0 ELSE 1 END AS is_new

    FROM Complaints c
    JOIN  Departments        d  ON d.department_id  = c.department_id
    LEFT JOIN ComplaintCategories cc ON cc.category_id = c.category_id
    JOIN  Students           s  ON s.student_id     = c.student_id

    WHERE
        c.assigned_to_staff_id = @StaffId
        AND (@Status IS NULL OR c.status = @Status)

    ORDER BY
        -- Unseen first, then assignment date
        CASE WHEN EXISTS (
            SELECT 1 FROM History h 
            WHERE h.complaint_id = c.complaint_id 
              AND h.changed_by_staff_id = @StaffId
        ) THEN 1 ELSE 0 END,
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
        IF @NewStatus NOT IN ('Pending', 'In-Progress', 'Resolved', 'Rejected', 'Reopened')
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

        IF NOT EXISTS (SELECT 1 FROM Complaints WHERE complaint_id = @ComplaintId AND assigned_to_staff_id = @StaffId)
        BEGIN
            SET @ResultCode    = 3;
            SET @ResultMessage = 'Unauthorized: Complaint not assigned to you.';
            RETURN;
        END

        DECLARE @OldStatus VARCHAR(20);
        SELECT @OldStatus = status FROM Complaints WHERE complaint_id = @ComplaintId;

        UPDATE Complaints
        SET status = @NewStatus
        WHERE complaint_id = @ComplaintId;

        INSERT INTO History (complaint_id, changed_by_staff_id, action_type, old_status, new_status, remarks)
        VALUES (
            @ComplaintId,
            @StaffId,
            'StatusChange',
            @OldStatus,
            @NewStatus,
            'Status changed from ' + @OldStatus + ' to ' + @NewStatus
        );

        SET @ResultCode    = 0;
        SET @ResultMessage = 'Status updated successfully.';
    END TRY
    BEGIN CATCH
        SET @ResultCode    = 4;
        SET @ResultMessage = 'Error: ' + ERROR_MESSAGE();
    END CATCH
END;
GO

CREATE OR ALTER PROCEDURE GetStaffFeedback
    @StaffId INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT 
        f.feedback_id,
        f.rating,
        f.comments,
        f.feedback_date,
        c.complaint_id,
        c.title AS complaint_title,
        s.name AS student_name
    FROM Feedback f
    JOIN Complaints c ON f.complaint_id = c.complaint_id
    JOIN Students s ON f.student_id = s.student_id
    WHERE c.assigned_to_staff_id = @StaffId
    ORDER BY f.feedback_date DESC;
END;
GO

CREATE OR ALTER PROCEDURE GetStaffNotifications
    @StaffId INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT 
        notification_id,
        complaint_id,
        notification_type,
        message,
        is_read,
        created_at
    FROM Notifications
    WHERE staff_id = @StaffId
    ORDER BY created_at DESC;
END;
GO

CREATE OR ALTER PROCEDURE MarkNotificationAsRead
    @NotificationId INT
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE Notifications
    SET is_read = 1
    WHERE notification_id = @NotificationId;
END;
GO

CREATE OR ALTER PROCEDURE AssignComplaintToStaff
    @ComplaintId INT,
    @StaffId     INT,
    @AdminId     INT
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        -- Update the complaint
        UPDATE Complaints
        SET assigned_to_staff_id = @StaffId,
            assigned_by_admin_id = @AdminId,
            assignment_date      = GETDATE(),
            status               = 'In-Progress'
        WHERE complaint_id = @ComplaintId;

        -- Log to History
        INSERT INTO History (complaint_id, changed_by_admin_id, action_type, remarks)
        VALUES (@ComplaintId, @AdminId, 'Assignment', 'Complaint assigned to staff');

        -- Create Notification for Staff
        DECLARE @Msg VARCHAR(MAX);
        SELECT @Msg = 'New task assigned: ' + title FROM Complaints WHERE complaint_id = @ComplaintId;
        
        INSERT INTO Notifications (complaint_id, staff_id, notification_type, message)
        VALUES (@ComplaintId, @StaffId, 'Assigned', @Msg);

    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END;
GO

CREATE OR ALTER PROCEDURE SubmitFeedback
    @ComplaintId INT,
    @StudentId   INT,
    @Rating      INT,
    @Comments    VARCHAR(MAX)
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        -- 1. Insert Feedback
        INSERT INTO Feedback (complaint_id, student_id, rating, comments)
        VALUES (@ComplaintId, @StudentId, @Rating, @Comments);

        -- 2. Find assigned staff
        DECLARE @StaffId INT;
        DECLARE @Title VARCHAR(200);
        SELECT @StaffId = assigned_to_staff_id, @Title = title 
        FROM Complaints 
        WHERE complaint_id = @ComplaintId;

        -- 3. Notify Staff (if assigned)
        IF @StaffId IS NOT NULL
        BEGIN
            INSERT INTO Notifications (complaint_id, staff_id, notification_type, message)
            VALUES (@ComplaintId, @StaffId, 'Feedback', 'New feedback received for: ' + @Title);
        END

    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END;
GO

CREATE OR ALTER PROCEDURE GetStaffAnalytics
    @StaffId INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT 
        (SELECT COUNT(*) FROM Complaints WHERE assigned_to_staff_id = @StaffId) AS TotalAssigned,
        (SELECT COUNT(*) FROM Complaints WHERE assigned_to_staff_id = @StaffId AND status = 'Resolved') AS Resolved,
        (SELECT COUNT(*) FROM Complaints WHERE assigned_to_staff_id = @StaffId AND status IN ('Pending', 'In-Progress', 'Reopened')) AS Pending,
        (SELECT ISNULL(AVG(CAST(f.rating AS DECIMAL(3,2))), 0) 
         FROM Feedback f 
         JOIN Complaints c ON f.complaint_id = c.complaint_id 
         WHERE c.assigned_to_staff_id = @StaffId) AS AvgRating
END;
GO





