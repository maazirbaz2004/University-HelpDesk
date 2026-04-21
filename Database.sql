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