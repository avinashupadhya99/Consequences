import { Button } from 'react-bootstrap';
import { auth } from '../../firebase.js';


function SignOut() {
    return auth.currentUser && (
      <Button className="sign-out" variant="danger" size="sm"  onClick={() => auth.signOut()}>Sign out</Button>
    )
  }

export default SignOut;