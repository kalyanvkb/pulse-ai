import React from "react";
import useDailyIntelligence
  from "../hooks/useDailyIntelligence";

export default function DailyIntelligence() {

  const {
    data,
    loading,
    error
  } = useDailyIntelligence();

  if (loading) {

    return (
      <div className="page">
        Loading Daily Intelligence...
      </div>
    );
  }

  if (error) {

    return (
      <div className="page">
        {error}
      </div>
    );
  }

  return (

    <div className="page">

      <h1>
        Daily Intelligence
      </h1>

      <pre>
        {JSON.stringify(
          data,
          null,
          2
        )}
      </pre>

    </div>
  );
}