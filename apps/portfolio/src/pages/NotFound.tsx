import { Link } from "react-router-dom";
import { useDocumentTitle } from "../hooks/useDocumentTitle";

export default function NotFound() {
  useDocumentTitle("Page not found");
  return (
    <section className="section">
      <div className="wrap narrow">
        <p className="k">404</p>
        <h1 className="page-title">That page doesn't exist.</h1>
        <p className="lead">The link may be broken, or the page may have moved.</p>
        <Link className="btn btn-primary" to="/">
          Back to home
        </Link>
      </div>
    </section>
  );
}
