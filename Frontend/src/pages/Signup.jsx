import React from 'react'

const Signup = () => {
  return (
    <>
        <div>
            <form>
                <label>Username</label>
                <input type="text" name="name" required placeholder='Enter Your Username'/> <br />
                <label>Email</label>
                <input type="email" name="email" required placeholder='Enter Your email'/> <br />
                <label>Password</label>
                <input type="password" name="password" required placeholder='Enter Your Password'/> <br />
                <label>Phone</label>
                <input type="text" name="phone" required placeholder='Enter Your Phone Number'/> <br />
                <input type="submit" value="Submit" />
            </form>
        </div>
    </>
)
}

export default Signup