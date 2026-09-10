import React from "react";
import { staticFile } from "remotion";
import { Icon } from "./WorkvivoIcons";
import { usePerson } from "../../customize/CustomizationProvider";
import { useT } from "../../customize/uiStrings";

export const WorkvivoSidebar: React.FC = () => {
  const ui = useT();
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
          <div className="mn">{ui(person.name)}</div>
          <div className="mr">{ui(person.title)}</div>
        </div>
      </div>
      <nav className="navlist">
        <a className="nav" style={{ height: "38.571px" }}>
          <span className="ni">
            <Icon href="#i-ui-home-nav-rail" className="li nav-ico" width="16.80" height="16.80" />
          </span>
          <span className="nl">{ui("Home")}</span>
        </a>
        <a className="nav" style={{ height: "38.571px" }}>
          <span className="ni">
            <Icon href="#i-ui-my-company" className="li nav-ico" width="16.80" height="16.80" />
          </span>
          <span className="nl">{ui("My Company")}</span>
        </a>
        <a className="nav" style={{ height: "38.571px" }}>
          <span className="ni">
            <Icon href="#i-ui-resources" className="li nav-ico" width="16.80" height="16.80" />
          </span>
          <span className="nl">{ui("Communications")}</span>
        </a>
        <a className="nav" style={{ height: "38.571px" }}>
          <span className="ni">
            <Icon href="#i-ui-chat" className="li nav-ico" width="16.80" height="16.80" />
          </span>
          <span className="nl">{ui("Chat")}</span>
          <span className="astack" style={{ marginLeft: "auto", marginRight: 4 }}>
            <img className="av" src={staticFile("img/avatar-3.jpeg")} style={{ objectFit: "cover", display: "block", width: 17, height: 17 }} alt="" />
            <img className="av" src={staticFile("img/avatar-1.jpeg")} style={{ objectFit: "cover", display: "block", width: 17, height: 17 }} alt="" />
          </span>
        </a>
        <a className="nav" style={{ height: "38.571px" }}>
          <span className="ni">
            <Icon href="#i-ui-spaces" className="li nav-ico" width="16.80" height="16.80" />
          </span>
          <span className="nl">{ui("Spaces")}</span>
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
          <span className="nl">{ui("Seer")}</span>
        </a>
        <a className="nav" style={{ height: "38.571px" }}>
          <span className="ni">
            <Icon href="#i-ui-admin" className="li nav-ico" width="16.80" height="16.80" />
          </span>
          <span className="nl">{ui("Admin")}</span>
        </a>
        <div className="sec">{ui("EXPLORE")}</div>
        <a className="nav" style={{ height: "38.571px" }}>
          <span className="ni">
            <Icon href="#i-ui-news" className="li nav-ico" width="16.80" height="16.80" />
          </span>
          <span className="nl">{ui("News")}</span>
        </a>
        <a className="nav" style={{ height: "38.571px" }}>
          <span className="ni">
            <Icon href="#i-ui-events-nav-rail" className="li nav-ico" width="16.80" height="16.80" />
          </span>
          <span className="nl">{ui("Events")}</span>
        </a>
        <a className="nav" style={{ height: "38.571px" }}>
          <span className="ni">
            <Icon href="#i-ui-pages" className="li nav-ico" width="16.80" height="16.80" />
          </span>
          <span className="nl">{ui("Pages")}</span>
        </a>
        <a className="nav" style={{ height: "38.571px" }}>
          <span className="ni">
            <Icon href="#i-ui-podcasts" className="li nav-ico" width="16.80" height="16.80" />
          </span>
          <span className="nl">{ui("Podcasts")}</span>
        </a>
        <div className="navdiv"></div>
        <a className="nav" style={{ height: "42.857px" }}>
          <span className="ni">
            <Icon href="#i-ui-surveys-and-forms" className="li nav-ico" width="16.80" height="16.80" />
          </span>
          <span className="nl">{ui("Survey & Forms")}</span>
        </a>
        <a className="nav" style={{ height: "42.857px" }}>
          <span className="ni">
            <Icon href="#i-ui-newsletters" className="li nav-ico" width="16.80" height="16.80" />
          </span>
          <span className="nl">{ui("Newsletters")}</span>
        </a>
        <a className="nav" style={{ height: "42.857px" }}>
          <span className="ni">
            <Icon href="#i-ui-journeys" className="li nav-ico" width="16.80" height="16.80" />
          </span>
          <span className="nl">{ui("Journeys")}</span>
        </a>
        <div className="sec">{ui("CONNECT")}</div>
        <a className="nav" style={{ height: "38.571px" }}>
          <span className="ni">
            <Icon href="#i-ui-connect" className="li nav-ico" width="16.80" height="16.80" />
          </span>
          <span className="nl">{ui("People")}</span>
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
          <span className="nl">{ui("Teams")}</span>
          <span className="astack" style={{ marginLeft: "auto", marginRight: 4 }}>
            <img className="av" src={staticFile("img/avatar-5.jpeg")} style={{ objectFit: "cover", display: "block", width: 17, height: 17 }} alt="" />
            <img className="av" src={staticFile("img/avatar-6.jpeg")} style={{ objectFit: "cover", display: "block", width: 17, height: 17 }} alt="" />
          </span>
        </a>
        <a className="nav" style={{ height: "38.571px" }}>
          <span className="ni">
            <Icon href="#i-ui-org-chart" className="li nav-ico" width="16.80" height="16.80" />
          </span>
          <span className="nl">{ui("Org Chart")}</span>
        </a>
      </nav>
      <div className="sec sec2">{ui("RESOURCES")}</div>
      <div className="res">
        <div className="rc">
          <Icon href="#i-ui-apps-widget" width="16.00" height="16.00" />
          <span>{ui("Apps")}</span>
        </div>
        <div className="rc">
          <Icon href="#i-ui-documents-nav" width="16.00" height="16.00" />
          <span>{ui("Docs")}</span>
        </div>
        <div className="rc">
          <Icon href="#i-ui-gallery" width="16.00" height="16.00" />
          <span>{ui("Gallery")}</span>
        </div>
      </div>
    </div>
  );
};
