import React from "react";
import { staticFile } from "remotion";
import { Icon } from "./WorkvivoIcons";
import { usePerson } from "../../customize/CustomizationProvider";

export const WorkvivoSidebar: React.FC = () => {
  const person = usePerson();
  return (
    <div className="rail">
      <div className="railtop">
        <span className="collapse">|&#8592;</span>
      </div>
      <div className="me">
        <img
          className="meav"
          src={person.avatarUrl}
          alt=""
          style={{ width: 34.29, height: 34.29, ...person.avatarFit }}
        />
        <div className="mt">
          <div className="mn">{person.name}</div>
          <div className="mr">{person.title}</div>
        </div>
      </div>
      <nav className="navlist">
        <a className="nav" style={{ height: "38.571px" }}>
          <span className="ni">
            <Icon href="#i-ui-home-nav-rail" className="li nav-ico" width="16.80" height="16.80" />
          </span>
          <span className="nl">Home</span>
        </a>
        <a className="nav" style={{ height: "38.571px" }}>
          <span className="ni">
            <Icon href="#i-ui-my-company" className="li nav-ico" width="16.80" height="16.80" />
          </span>
          <span className="nl">My Company</span>
        </a>
        <a className="nav" style={{ height: "38.571px" }}>
          <span className="ni">
            <Icon href="#i-ui-resources" className="li nav-ico" width="16.80" height="16.80" />
          </span>
          <span className="nl">Communications</span>
        </a>
        <a className="nav" style={{ height: "38.571px" }}>
          <span className="ni">
            <Icon href="#i-ui-chat" className="li nav-ico" width="16.80" height="16.80" />
          </span>
          <span className="nl">Chat</span>
          <span className="astack" style={{ marginLeft: "auto", marginRight: 4 }}>
            <img className="av" src={staticFile("img/avatar-3.jpeg")} style={{ objectFit: "cover", display: "block", width: 17, height: 17 }} alt="" />
            <img className="av" src={staticFile("img/avatar-1.jpeg")} style={{ objectFit: "cover", display: "block", width: 17, height: 17 }} alt="" />
          </span>
        </a>
        <a className="nav" style={{ height: "38.571px" }}>
          <span className="ni">
            <Icon href="#i-ui-spaces" className="li nav-ico" width="16.80" height="16.80" />
          </span>
          <span className="nl">Spaces</span>
          <span className="astack" style={{ marginLeft: "auto", marginRight: 4 }}>
            <img className="av" src={staticFile("img/avatar-4.jpeg")} style={{ objectFit: "cover", display: "block", width: 17, height: 17 }} alt="" />
            <img className="av" src={staticFile("img/avatar-5.jpeg")} style={{ objectFit: "cover", display: "block", width: 17, height: 17 }} alt="" />
            <img className="av" src={staticFile("img/avatar-6.jpeg")} style={{ objectFit: "cover", display: "block", width: 17, height: 17 }} alt="" />
          </span>
        </a>
        <a className="nav" style={{ height: "38.571px" }}>
          <span className="ni">
            <Icon href="#i-ui-employee-insights" className="li nav-ico" width="16.80" height="16.80" />
          </span>
          <span className="nl">Seer</span>
        </a>
        <a className="nav" style={{ height: "38.571px" }}>
          <span className="ni">
            <Icon href="#i-ui-admin" className="li nav-ico" width="16.80" height="16.80" />
          </span>
          <span className="nl">Admin</span>
        </a>
        <div className="sec">EXPLORE</div>
        <a className="nav" style={{ height: "38.571px" }}>
          <span className="ni">
            <Icon href="#i-ui-news" className="li nav-ico" width="16.80" height="16.80" />
          </span>
          <span className="nl">News</span>
        </a>
        <a className="nav" style={{ height: "38.571px" }}>
          <span className="ni">
            <Icon href="#i-ui-events-nav-rail" className="li nav-ico" width="16.80" height="16.80" />
          </span>
          <span className="nl">Events</span>
        </a>
        <a className="nav" style={{ height: "38.571px" }}>
          <span className="ni">
            <Icon href="#i-ui-pages" className="li nav-ico" width="16.80" height="16.80" />
          </span>
          <span className="nl">Pages</span>
        </a>
        <a className="nav" style={{ height: "38.571px" }}>
          <span className="ni">
            <Icon href="#i-ui-podcasts" className="li nav-ico" width="16.80" height="16.80" />
          </span>
          <span className="nl">Podcasts</span>
        </a>
        <div className="navdiv"></div>
        <a className="nav" style={{ height: "42.857px" }}>
          <span className="ni">
            <Icon href="#i-ui-surveys-and-forms" className="li nav-ico" width="16.80" height="16.80" />
          </span>
          <span className="nl">Survey &amp; Forms</span>
        </a>
        <a className="nav" style={{ height: "42.857px" }}>
          <span className="ni">
            <Icon href="#i-ui-newsletters" className="li nav-ico" width="16.80" height="16.80" />
          </span>
          <span className="nl">Newsletters</span>
        </a>
        <a className="nav" style={{ height: "42.857px" }}>
          <span className="ni">
            <Icon href="#i-ui-journeys" className="li nav-ico" width="16.80" height="16.80" />
          </span>
          <span className="nl">Journeys</span>
        </a>
        <div className="sec">CONNECT</div>
        <a className="nav" style={{ height: "38.571px" }}>
          <span className="ni">
            <Icon href="#i-ui-connect" className="li nav-ico" width="16.80" height="16.80" />
          </span>
          <span className="nl">People</span>
          <span className="astack" style={{ marginLeft: "auto", marginRight: 4 }}>
            <img className="av" src={staticFile("img/avatar-1.jpeg")} style={{ objectFit: "cover", display: "block", width: 17, height: 17 }} alt="" />
            <img className="av" src={staticFile("img/avatar-3.jpeg")} style={{ objectFit: "cover", display: "block", width: 17, height: 17 }} alt="" />
            <img className="av" src={staticFile("img/avatar-4.jpeg")} style={{ objectFit: "cover", display: "block", width: 17, height: 17 }} alt="" />
          </span>
        </a>
        <a className="nav" style={{ height: "38.571px" }}>
          <span className="ni">
            <Icon href="#i-ui-teams" className="li nav-ico" width="16.80" height="16.80" />
          </span>
          <span className="nl">Teams</span>
          <span className="astack" style={{ marginLeft: "auto", marginRight: 4 }}>
            <img className="av" src={staticFile("img/avatar-5.jpeg")} style={{ objectFit: "cover", display: "block", width: 17, height: 17 }} alt="" />
            <img className="av" src={staticFile("img/avatar-6.jpeg")} style={{ objectFit: "cover", display: "block", width: 17, height: 17 }} alt="" />
          </span>
        </a>
        <a className="nav" style={{ height: "38.571px" }}>
          <span className="ni">
            <Icon href="#i-ui-org-chart" className="li nav-ico" width="16.80" height="16.80" />
          </span>
          <span className="nl">Org Chart</span>
        </a>
      </nav>
      <div className="sec sec2">RESOURCES</div>
      <div className="res">
        <div className="rc">
          <Icon href="#i-ui-apps-widget" width="16.00" height="16.00" />
          <span>Apps</span>
        </div>
        <div className="rc">
          <Icon href="#i-ui-documents-nav" width="16.00" height="16.00" />
          <span>Docs</span>
        </div>
        <div className="rc">
          <Icon href="#i-ui-gallery" width="16.00" height="16.00" />
          <span>Gallery</span>
        </div>
      </div>
    </div>
  );
};
