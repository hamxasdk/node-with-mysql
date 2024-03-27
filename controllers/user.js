const bcrypt = require('bcrypt');
const db = require("../config/db");
const jwt = require('jsonwebtoken');
const main = require('../email/email');
require("dotenv").config();
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    auth: {
        user: 'humberto.funk64@ethereal.email',
        pass: 'cS2AUUjX9EhYBs7XgM'
    }
});

async function sendVerificationEmail(email) {
  const token = jwt.sign({ email }, process.env.SECRET_KEY, { expiresIn: "1d" });

  // Update the verification_token column in the users table
  try {
    await db.query("UPDATE users SET verification_token = ? WHERE email = ?", [token, email]);
  } catch (error) {
    console.error("Error updating verification token:", error);
    throw new Error("Failed to update verification token in the database");
  }

  const info = await transporter.sendMail({
    from: 'Maddison Foo Koch 👻" <humberto.funk64@ethereal.email>',
    to: email,
    subject: "Email Verification",
    text: `Click on the following link to verify your email: http://yourdomain.com/verify-email?token=${token}`,
    html: `<p>Click on the following link to verify your email: <a href="http://yourdomain.com/verify-email?token=${token}">Verify Email</a></p>`,
  });

  console.log("Message sent: %s", info.messageId);
}


// async function sendVerificationEmail(email) {
//   const token = jwt.sign({ email }, process.env.SECRET_KEY, { expiresIn: "1d" });
// console.log("email",email)
//   const info = await transporter.sendMail({
//     from: 'Maddison Foo Koch 👻" <humberto.funk64@ethereal.email>',
//     to: email,
//     subject: "Email Verification",
//     text: `Click on the following link to verify your email: http://yourdomain.com/verify-email?token=${token}`,
//     html: `<p>Click on the following link to verify your email: <a href="http://yourdomain.com/verify-email?token=${token}">Verify Email</a></p>`,
//   });

//   console.log("Message sent: %s", info.messageId);
// }
async function createUser(req, res) {
  const { email, password } = req.body;

  try {
    // Check if the email already exists
    const emailExists = await checkEmailExists(email);
    if (emailExists) {
      return res.status(400).json({ msg: "Email already exists" });
    }

    // Hash the password before storing it
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert the user into the database
    await insertUser(email, hashedPassword);

    sendVerificationEmail(email); // Send verification email

    // User created successfully
    res.status(200).json( {msg: "User created successfully" });
  } catch (err) {
    console.error("Error:", err);
    return res.status(500).json({ msg: "Internal Server Error" });
  }
}

function checkEmailExists(email) {
  return new Promise((resolve, reject) => {
    db.query("SELECT * FROM users WHERE email = ?", [email], (error, results) => {
      if (error) {
        console.error("Error checking email:", error);
        reject(error);
      } else {
        resolve(results.length > 0);
      }
    });
  });
}

function insertUser(email, hashedPassword) {
  return new Promise((resolve, reject) => {
    db.query(
      "INSERT INTO users (email, password) VALUES (?, ?)",
      [email, hashedPassword],
      (error, results) => {
        if (error) {
          console.error("Error inserting user:", error);
          reject(error);
        } else {
          resolve();
        }
      }
    );
  });
}


// async function createUser(req, res, callback) {
//   const { email, password } = req.body;

//   try {
//     // Check if the email already exists
//     console.log("console 1")
//     db.query("SELECT * FROM users WHERE email = ?", [email], async function (
//       error,
//       results,
//       fields
//     ) {
   

//       if (error) {
//         console.log("console 2")
//         return res.status(401).json({msg:"Invalid Email"})
//       }

//       if (results.length > 0) {
//     console.log("console 3")

//         // Email already exists
//         return res.status(400).json({ msg: "Email already exists" });
//       }

//       // Hash the password before storing it
//       const hashedPassword = await bcrypt.hash(password, 10);
//       console.log("console 4")
//       // Insert the user into the database
//       db.query(
//         "INSERT INTO users (email, password) VALUES (?, ?)",
//         [email, hashedPassword],
//         function (error, results, fields) {
//           if (error) {
//             return res.status(401).json({msg:"Something went wrong"})
//           }
//           sendVerificationEmail(email); // Send verification email
//           callback(null, results);
//         }
//       );
//       console.log("console 5")
//     });
//     console.log("console 6")
//   } catch (err) {
//     console.log("err", err);
//     callback(err);
//   }
// }



// async function createUser(req, res, callback) {
//      const{email,password} = req.body
//     console.log("Running createUser");
// // const _email =email.toString()
// // const _password =password.toString()
//     try {
//         // Check if the email already exists
//         db.query('SELECT * FROM users WHERE email = ?', [email], async function(error, results, fields) {
//             if (error) {
//                 return callback(error);
//             }

//             if (results.length > 0) {
//                 // Email already exists
//                 return res.status(400).json({msg:"Email already Exists"})
//                 // callback(new Error('Email already exists'));
//             }

//             // Hash the password before storing it
//             const hashedPassword = await bcrypt.hash(password, 10);

//             // Insert the user into the database
//             db.query('INSERT INTO users (email, password) VALUES (?, ?)', [email, hashedPassword], function(error, results, fields) {
//                 if (error) {
//                     return callback(error);
//                 }
//                 main()
//                 callback(null, results);
//             });
//         });
//     } catch (err) {
//         console.log("err",err)
//         callback(err);
//     }
// }


async function login(req, res) {
    const { email, password } = req.body;
    console.log("Running login");

    try {
        console.log("console 1")
        // Check if the email exists in the database
        db.query('SELECT * FROM users WHERE email = ?', [email], async function(error, results, fields) {
            if (error) {
                return res.status(500).json({ msg: "Internal Server Error" });
            }

            if (results.length === 0) {
                // Email does not exist
                return res.status(400).json({ msg: "Invalid Email or Password" });
            }

            // Verify the password
            const user = results[0];
            const match = await bcrypt.compare(password, user.password);

            if (!match) {
                // Password does not match
                return res.status(400).json({ msg: "Invalid Email or Password" });
            }
            console.log("console 2")

            // Password is correct, generate a JWT token
            const token = jwt.sign({ userId: user.id, email: user.email }, process.env.SECRET_KEY, { expiresIn: '1h' });
            console.log("console 3")

            // Respond with the JWT token
            res.json({ token });
        });
    } catch (err) {
        console.log("err",err)
        res.status(500).json({ msg: "Internal Server Error" });
    }
}

async function verifyEmail( req, res) {
  console.log("runnn 1");
  try {
    // Verify the token
    const {token} = req.query
    const decoded = jwt.verify(token, process.env.SECRET_KEY);
    const { email } = decoded;

    // Update the email_verified field in the database
    await db.query("UPDATE users SET email_verified = true WHERE email = ?", [email]);

    // Redirect the user to a success page or send a success response
    res.status(200).send('Email verified successfully');
  } catch (error) {
    console.error("Error verifying email:", error);
    // Redirect the user to an error page or send an error response
    res.status(500).send('Failed to verify email');
  }
}


async function sendPasswordResetEmail(email, resetToken) {
  const transporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    auth: {
        user: 'humberto.funk64@ethereal.email',
        pass: 'cS2AUUjX9EhYBs7XgM'
    }
  });

  const resetLink = `http://yourdomain.com/reset-password?token=${resetToken}`;
  
  const info = await transporter.sendMail({
    from: 'Your Sender Name <your-email@example.com>',
    to: email,
    subject: 'Password Reset Request',
    text: `Click on the following link to reset your password: ${resetLink}`,
    html: `<p>Click on the following link to reset your password: <a href="${resetLink}">${resetLink}</a></p>`
  });

  console.log("Password reset email sent: %s", info.messageId);
}
 const forgotPassword =async(req, res) => {
  const { email } = req.body;

  // Check if the user with the given email exists in the database
  const user = await db.query("SELECT * FROM users WHERE email = ?", [email]);

  if (!user) {
    return res.status(404).send('User not found');
  }

  // Generate a unique reset token
  const resetToken = jwt.sign({ email }, process.env.SECRET_KEY, { expiresIn: '1h' });

  // Store the reset token in the database (you'll need to add a reset_token column)
  await db.query("UPDATE users SET reset_token = ? WHERE email = ?", [resetToken, email]);

  // Send password reset email
  await sendPasswordResetEmail(email, resetToken);

  res.status(200).send('Password reset email sent');
};

async function resetPassword (req, res)  {
  const { token, newPassword } = req.body;

  try {
    // Verify the reset token
    const decoded = jwt.verify(token, process.env.SECRET_KEY);
    const { email } = decoded;
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    // Update the user's password in the database
    await db.query("UPDATE users SET password = ? WHERE email = ?", [hashedPassword, email]);
    
    // Clear the reset token from the database
    await db.query("UPDATE users SET reset_token = NULL WHERE email = ?", [email]);

    res.status(200).send('Password reset successful');
  } catch (error) {
    console.error("Error resetting password:", error);
    res.status(500).send('Failed to reset password');
  }
}

module.exports = {createUser,login,verifyEmail,sendPasswordResetEmail,forgotPassword,resetPassword};
