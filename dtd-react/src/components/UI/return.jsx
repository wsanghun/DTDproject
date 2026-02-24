{
  gameOver && (
    <div
      style={{
        position: "absolute",
        top: "40%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        fontSize: "48px",
        fontWeight: "bold",
        color: "red",
        background: "rgba(0,0,0,0.6)",
        padding: "20px 40px",
        borderRadius: "12px",
        zIndex: 10,
      }}
    >
      GAME OVER
      <div style={{ fontSize: "20px", marginTop: "10px" }}>
        몬스터가 80마리를 초과했습니다
      </div>
    </div>
  );
}
