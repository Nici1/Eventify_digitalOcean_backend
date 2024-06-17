CREATE TABLE Spectator (ID smallint NOT NULL AUTO_INCREMENT PRIMARY KEY, 
`Name` varchar(50) NOT NULL,
Surname varchar(50) NOT NULL,
Email varchar(50) NOT NULL,
`Password` varchar(65) NOT NULL);

CREATE TABLE Category (ID tinyint NOT NULL AUTO_INCREMENT PRIMARY KEY, 
`Name` varchar(50) NOT NULL);

CREATE TABLE Performer (ID smallint NOT NULL AUTO_INCREMENT PRIMARY KEY, 
`Name` varchar(50) NOT NULL,
Surname varchar(50) NOT NULL,
Artist varchar(70),
CategoryID tinyint NOT NULL,
FOREIGN KEY (CategoryID) REFERENCES Category(ID),
Email varchar(50) NOT NULL,
`Password` varchar(65) NOT NULL);


CREATE TABLE Landlord (ID smallint NOT NULL AUTO_INCREMENT PRIMARY KEY, 
`Name` varchar(50) NOT NULL,
Surname varchar(50) NOT NULL,
Address varchar(150) NOT NULL,
DateofBirth date NOT NULL,
Email varchar(50) NOT NULL,
`Password` varchar(65) NOT NULL);




CREATE TABLE Venue (ID smallint NOT NULL AUTO_INCREMENT PRIMARY KEY, 
`Name` varchar(50) NOT NULL,
Capacity smallint,
Address varchar(150) NOT NULL,
CategoryID tinyint NOT NULL,
LandlordID smallint NOT NULL,
FOREIGN KEY (CategoryID) REFERENCES Category(ID),
FOREIGN KEY (LandlordID) REFERENCES Landlord(ID));

CREATE TABLE Event (ID smallint NOT NULL AUTO_INCREMENT PRIMARY KEY, 
`Name` varchar(250) NOT NULL,
DateofPerformance date NOT NULL,
CategoryID tinyint NOT NULL,
FOREIGN KEY (CategoryID) REFERENCES Category(ID));

ALTER TABLE Event
ADD COLUMN Description TEXT(1500);



CREATE TABLE VenueCategory (VenueID smallint NOT NULL, 
CategoryID smallint NOT NULL);

CREATE TABLE SpectatorEvent (SpectatorID smallint NOT NULL, 
EventID smallint NOT NULL);

/*
INSERT INTO Category (Name) VALUES ('Concert'), ('Theatre'), ('Film'), ('Sports'), ('Art Exhibitions'), ('Conference'), ('Party'), ('Fitness')
*/

/*
CREATE TABLE VenueAvailability (ID smallint NOT NULL AUTO_INCREMENT PRIMARY KEY, VenueID smallint NOT NULL, FOREIGN KEY (VenueID) REFERENCES Venue(ID), `Date` date NOT NULL, StartTime time, EndTime time, Status ENUM('available', 'booked'));
*/