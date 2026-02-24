export default function MenuButton({ label, image, position, onClick }) {
  return (
    <button className={`menu-button ${position}`} onClick={onClick}>
      <div className="button-content">
        {image && <img src={image} alt="" className="menu-icon" />}
        <span className={"menu-label" + (label === "GACHA" ? " dex" : "")}>
          {label}
        </span>
      </div>
    </button>
  );
}
