import mysql from 'mysql2';
import dotenv from 'dotenv'

dotenv.config({path: '.env'})


const pool = mysql.createPool({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    port: process.env.MYSQL_PORT
    
}).promise()

async function insert_Spectator(Name, Surname, Email, Password){

    const result = await pool.query(`INSERT INTO Spectator (Name, Surname, Email, Password) VALUES (?, ?, ?, ?)`, [Name, Surname, Email, Password]);
    return result
}

async function get_Spectator(Email){

    const result = await pool.query(`SELECT * FROM Spectator WHERE Email=?`, [Email]);
    return result[0]
}




async function get_Landlord(Email){

    const result = await pool.query(`SELECT * FROM Landlord WHERE Email=?`, [Email]);
    return result[0]
}



async function insert_Landlord(Name, Surname, Address, DateofBirth, Email, Password){

    const result = await pool.query(`INSERT INTO Landlord (Name, Surname, Address, DateofBirth, Email, Password) VALUES (?, ?, ?, ?, ?, ?)`, 
    [Name, Surname, Address, DateofBirth, Email, Password]);
    return result
}


async function insert_Performer(Name, Surname, Artist, Category, Email, Password){

    const Category_id = await get_CategoryID(Category);
    const result = await pool.query(`INSERT INTO Performer (Name, Surname, Artist, CategoryID, Email, Password) VALUES (?, ?, ?, ?, ?, ?)`, [Name, Surname, Artist, Category_id, Email, Password]);
    return result[0].insertId
}

async function get_Performer(Email){

    const result = await pool.query(`SELECT * FROM Performer WHERE Email=?`, [Email]);
    return result[0]
}


async function insert_Venue(Name, Capacity, City, Address, Category, Description, Landlord_id){

    const Category_id = await get_CategoryID(Category);
    const result = await pool.query(`INSERT INTO Venue (Name, Capacity, City, Address,  CategoryID, Description, LandlordID) VALUES (?, ?, ?, ?, ?, ?, ?)`, 
    [Name, Capacity, City, Address, Category_id, Description, Landlord_id]);
    console.log('From venue ', result[0].insertId)
    return result[0].insertId
}


async function insert_ticket(Venueavailability, SpectatorID){

    const result = await pool.query(`INSERT INTO VenueavailabilitySpectator (VenueavailabilityID, SpectatorID) VALUES (?, ?)`, [Venueavailability, SpectatorID]);
    return result[0]
}

async function get_Venue(pageNumber, pageSize, City) {

  const offset = (pageNumber - 1) * pageSize;

  let num_row = await pool.query(`SELECT COUNT(*) FROM Venue`);
  num_row = num_row[0][0]['COUNT(*)']

    if (City==='All'){
      const result = await pool.query(`SELECT ID, Name, Capacity, Address, LandlordID, City, Description FROM Venue ORDER BY ID LIMIT ? OFFSET ?`,
      [pageSize, offset]);
      
      
        return result[0];
      
  
    }
    else{
    const result = await pool.query(
    `SELECT ID, Name, Capacity, Address, LandlordID, City, Description FROM Venue WHERE City=? ORDER BY ID LIMIT ? OFFSET ?`,
    [City, pageSize, offset]);
        
        return result[0];
      
    }
    
  
}

async function get_Venue_length(City){
  let num_row;

  if (City === 'All') {
    num_row = await pool.query(`SELECT COUNT(*) AS rowCount FROM Venue`);
  } else {
    num_row = await pool.query(`SELECT COUNT(*) AS rowCount FROM Venue WHERE City = ?`, [City]);
  }

  num_row = num_row[0][0]['rowCount'];

  return num_row;
  
}


async function get_Applications_length(){
  let num_row;


  num_row = await pool.query(`SELECT COUNT(*) AS rowCount FROM Application`);
  

  num_row = num_row[0][0]['rowCount'];

  return num_row;
  
}


async function get_Events_length() {
  // Query to count the entries with status 'taken'
  const countResult = await pool.query(
    `SELECT COUNT(*) AS total FROM Venueavailability WHERE Status = 'taken'`
  );

  // Extract the count from the result
  const num_row = countResult[0][0].total;

  return num_row;
}



async function get_Venue_info(Name) {
  
  const result = await pool.query(`SELECT Name, Capacity, Address, Description, City, LandlordID FROM Venue WHERE Name = ?`,[Name]);

  return result[0];
}

async function get_Venue_Country() {

  const result = await pool.query(`SELECT DISTINCT Country FROM Venue ORDER BY Country`);
  return result[0];
}

async function get_Venue_City() {

  const result = await pool.query(`SELECT DISTINCT City FROM Venue ORDER BY City`);
  return result[0];
}

async function update_Venue_Description(description, venueID, landlordID){
  const result = await pool.query('UPDATE Venue SET Description = ? WHERE ID = ? AND LandlordID = ?', [description, venueID, landlordID]);
  return result[0]
}

async function get_CategoryID(Category){
    const Category_id = await pool.query(`SELECT ID FROM Category WHERE Name = ?`, [Category]);
    return Category_id[0][0].ID;

}


async function insert_time_Availability(venueID, startTime, endTime, date){

 const result = await pool.query(
            `INSERT INTO Venueavailability (VenueID, Date, StartTime, EndTime, Status) 
             VALUES (?, ?, ?, ?, ?)`,
            [venueID, date, startTime, endTime, 'available']
        );
  return result[0];

}


async function get_time_Availability(venueID, date){

 const intervals = await pool.query(
        `SELECT ID, StartTime, EndTime 
         FROM Venueavailability 
         WHERE VenueID = ? AND Date = ?`, 
        [venueID, date]
    );    
    return intervals[0];

}




async function get_date_Availability(venueID, month) {

  console.log('Month ', month)
    const results = await pool.query(
        `SELECT Date, Status
         FROM Venueavailability 
         WHERE VenueID = ? AND MONTH(Date) = ?`, 
        [venueID, month]
    );

    const dateStatusMap = new Map();

    results[0].forEach(({ Date, Status }) => {
        const dateStr = Date.toISOString().split('T')[0];
        if (!dateStatusMap.has(dateStr)) {
            dateStatusMap.set(dateStr, []);
        }
        dateStatusMap.get(dateStr).push(Status);
    });

    const colorCodedDates = {
        green: [],
        yellow: [],
        red: []
    };

    dateStatusMap.forEach((statuses, dateStr) => {
        const allAvailable = statuses.every(status => status === 'available');
        const allTaken = statuses.every(status => status === 'taken');
        
        if (allAvailable) {
            colorCodedDates.green.push(dateStr);
        } else if (allTaken) {
            colorCodedDates.red.push(dateStr);
        } else {
            colorCodedDates.yellow.push(dateStr);
        }
    });
    console.log('Colored Dates ', colorCodedDates)
    return colorCodedDates;
}







async function insert_Application(performerid, availabilityid){

    const result = await pool.query(`INSERT INTO Application (PerformerID, AvailabilityID) VALUES (?, ?)`, 
    [performerid, availabilityid]);
    return result
}

async function get_Events(pageNumber, pageSize) {
    const offset = (pageNumber - 1) * pageSize;

    try {
        // Fetch venueavailability entries with status 'taken'
        const availability = await pool.query(
            `SELECT
                Venueavailability.ID AS VenueavailabilityID,
                Performer.ID AS PerformerID,
                Performer.Artist AS PerformerName,
                Performer.Description AS PerformerDescription,
                Performer.Link,
                Venue.ID AS VenueID,
                Venue.Name AS VenueName,
                Venue.Description AS VenueDescription,
                Venue.LandlordID,
                GROUP_CONCAT(Venueavailability.Date, ' ', Venueavailability.StartTime, '-', Venueavailability.EndTime) AS DatesAndTimes
             FROM
                Venueavailability
             JOIN
                Performer ON Venueavailability.PerformerID = Performer.ID
             JOIN
                Venue ON Venueavailability.VenueID = Venue.ID
             WHERE
                Venueavailability.Status = 'taken'
             GROUP BY
                Venueavailability.ID, Performer.ID, Venue.ID
             ORDER BY
                Performer.ID
             LIMIT ?
             OFFSET ?`,
            [pageSize, offset]
        );

        const result = availability[0];

        if (result.length === 0) {
            console.log("No events found with status 'taken'.");
            return []; // Return an empty result if no events found
        }

        return result;
    } catch (error) {
        console.error("Error fetching events:", error);
        throw error; // Propagate the error for handling upstream
    }
}















async function get_Applications(pageNumber, pageSize, landlordID) {
  const offset = (pageNumber - 1) * pageSize;

  // Fetch venues for the landlord
  const venues = await pool.query(
    `SELECT * FROM Venue WHERE LandlordID = ? ORDER BY ID`,
    [landlordID]
  );
  const venueRows = venues[0];
  const venueIDs = venueRows.length > 0 ? venueRows.map(venue => venue.ID) : [];

  if (venueIDs.length === 0) {
    return []; // Return an empty result if no venues found
  }

  // Fetch availability for the fetched venues
  const availability = await pool.query(
    `SELECT * FROM Venueavailability WHERE VenueID IN (?) ORDER BY ID`,
    [venueIDs]
  );
  const availabilityRows = availability[0];
  const avIDs = availabilityRows.length > 0 ? availabilityRows.map(av => av.ID) : [];

  if (avIDs.length === 0) {
    return []; // Return an empty result if no availability found
  }
  console.log("avIDs ", avIDs)
  // Fetch applications with performer and venue details with pagination applied here
  const result = await pool.query(
    `SELECT
        Application.PerformerID,
        Application.AvailabilityID AS VenueavailabilityID,
        Performer.Artist AS PerformerName,
        Performer.Description,
        Performer.Link,
        Venue.ID AS VenueID,
        Venue.Name AS VenueName,
        GROUP_CONCAT(Venueavailability.Date, ' ', Venueavailability.StartTime, '-', Venueavailability.EndTime) AS DatesAndTimes
     FROM
        Application
     JOIN
        Venueavailability ON Application.AvailabilityID = Venueavailability.ID
     JOIN
        Performer ON Application.PerformerID = Performer.ID
     JOIN
        Venue ON Venueavailability.VenueID = Venue.ID
     WHERE
        Venueavailability.ID IN (?) 
     GROUP BY
        Performer.ID, Venue.ID, Application.PerformerID, Application.AvailabilityID
     ORDER BY
        Application.PerformerID
     LIMIT ?
     OFFSET ?`,
    [avIDs, pageSize, offset]
  );

  // Extract only the first `pageSize` entries from the result
  const truncatedResult = result[0].slice(0, pageSize);
  console.log(truncatedResult)
  return truncatedResult;
}


async function update_Venue_Status(ID, PerformerID) {

  console.log(ID, PerformerID);
  const update_result = await pool.query('UPDATE Venueavailability SET Status = ?, PerformerID = ? WHERE ID = ? AND Status = ?', ['taken', PerformerID, ID, 'available']);
  const deletion_result = await pool.query('DELETE FROM Application WHERE AvailabilityID = ?', [ID]);

 

}






async function get_MyVenues(pageNumber, pageSize, ID) {
  const offset = (pageNumber - 1) * pageSize;

  const result = await pool.query( `SELECT ID, Name, Capacity, Address, LandlordID, City, Description FROM Venue WHERE LandlordID=? ORDER BY ID LIMIT ? OFFSET ?`,
    [ID, pageSize, offset]);
  return result[0];
    }
    
async function get_MyVenue(ID) {

  const result = await pool.query( `SELECT ID, Name, Capacity, Address, LandlordID, City, Description FROM Venue WHERE LandlordID=?`,[ID]);
  return result[0];
    }


export {insert_Spectator, get_Spectator, insert_Landlord, get_Landlord, insert_Venue, get_Performer, insert_Performer, get_Venue, 
  get_Venue_City, get_Venue_Country, get_Venue_info, get_time_Availability,  insert_Application, get_Applications, update_Venue_Status, 
  get_date_Availability, get_Events, get_Events_length, insert_ticket, 
  get_MyVenues, get_Venue_length, update_Venue_Description, insert_time_Availability, get_Applications_length};