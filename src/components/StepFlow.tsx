type StepFlowProps = {
  currentStep: 1 | 2;
};

export default function StepFlow({ currentStep }: StepFlowProps) {
  return (
    <div className="d-flex align-items-center mb-3">
      <div className="d-flex align-items-center gap-2">
        <span
          className={`rounded-circle d-inline-flex align-items-center justify-content-center fw-semibold small${
            currentStep >= 1 ? " bg-primary text-white" : " border text-muted"
          }`}
          style={{ width: 28, height: 28 }}
        >
          {currentStep > 1 ? "✓" : "1"}
        </span>
        <span className={currentStep >= 1 ? "fw-semibold" : "text-muted"}>
          Create Test
        </span>
      </div>
      <div
        className="mx-3"
        style={{
          width: 48,
          height: 2,
          background: currentStep > 1 ? "#198754" : "#dee2e6",
        }}
      />
      <div className="d-flex align-items-center gap-2">
        <span
          className={`rounded-circle d-inline-flex align-items-center justify-content-center fw-semibold small${
            currentStep === 2 ? " bg-primary text-white" : " border text-muted"
          }`}
          style={{ width: 28, height: 28 }}
        >
          2
        </span>
        <span className={currentStep === 2 ? "fw-semibold" : "text-muted"}>
          Assign Test
        </span>
      </div>
      <span className="ms-3 text-muted small">
        Questions are selected &amp; configured in Step 2
      </span>
    </div>
  );
}
