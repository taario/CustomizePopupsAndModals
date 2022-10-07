import React, { useRef, useEffect } from 'react';
import WebViewer from '@pdftron/webviewer';
import './App.css';

const App = () => {
  const viewer = useRef(null);

  // if using a class, equivalent of componentDidMount 
  useEffect(() => {
    WebViewer(
      {
        path: '/webviewer/lib',
        initialDoc: '/files/PDFTRON_about.pdf',
      },
      viewer.current,
    ).then((instance) => {
      const { documentViewer, annotationManager, Annotations } = instance.Core;

      // Hide unecessary toolbar groups 
      instance.UI.disableElements([
        "toolbarGroup-Annotate",
        "toolbarGroup-Shapes",
        "toolbarGroup-Insert",
        "toolbarGroup-Edit",
        "toolbarGroup-FillAndSign",
      ]);

      // Override popup when a signature field is clicked
      const originalCreateInnerElement =
        Annotations.SignatureWidgetAnnotation.prototype.createInnerElement;

      Annotations.SignatureWidgetAnnotation.prototype.createInnerElement = function() {
        const ele = originalCreateInnerElement.apply(this, arguments);

        ele.addEventListener("click", (e) => {
          instance.UI.closeElements("signatureModal");
          if (!this.getAssociatedSignatureAnnotation()) {
            // In the case where a signature does not exist yet
            console.log("Signature does not exist");

            // @todo: Logic to open the custom signature modal
          } else {
            // In the case where a signature already exists
            console.log("Signature exists");
          }
        });

        return ele;
      };

      // Override popup with custom modal when field is created or edited
      const formFieldCreationManager = annotationManager.getFormFieldCreationManager();

      let selectedFormFieldAnnotation;

      var modal = {
        dataElement: "customFieldModal",
        render: function renderCustomModal() {
          var parentDiv = document.createElement("div");

          // Can check current field name if set already
          const fieldName = formFieldCreationManager.getFieldName(
            selectedFormFieldAnnotation
          );
          console.log({ fieldName });

          // Create array of options to be added
          const array = ["Volvo", "Saab", "Mercedes", "Audi"];

          // Create and append select list
          var selectList = document.createElement("select");
          selectList.id = "mySelect";

          // Create and append the options
          for (var i = 0; i < array.length; i++) {
            var option = document.createElement("option");
            option.value = array[i];
            option.text = array[i];
            selectList.appendChild(option);
          }

          selectList.onchange = (event) => {
            console.log("selected ", event.target.value);
            const response = formFieldCreationManager.setFieldName(
              selectedFormFieldAnnotation,
              event.target.value
            );
            console.log({ response });

            // Can set value as well

            formFieldCreationManager.setFieldValue(
              selectedFormFieldAnnotation,
              event.target.value
            );
            console.log(selectList.value);
          };

          const header = document.createElement("div");
          header.innerText = "Select an option";

          parentDiv.appendChild(header);
          parentDiv.appendChild(selectList);

          return parentDiv;
        },
      };

      instance.UI.setCustomModal(modal);
      instance.disableElements(["formFieldEditPopup"]);
      instance.UI.updateElement("formFieldEditButton", {
        onClick: () => instance.UI.openElements([modal.dataElement]),
      });

      annotationManager.on("annotationChanged", (annotations, action) => {
        const annotation = annotations[0];
        if (
          action === "add" &&
          annotation.isFormFieldPlaceholder() &&
          annotation.getCustomData("trn-editing-widget-id") === ""
        ) {
          selectedFormFieldAnnotation = annotation;
          instance.UI.openElements([modal.dataElement]);
        }
      });

      annotationManager.on("annotationSelected", (annotations, action) => {
        const annotation = annotations[0];
        if (
          action === "selected" &&
          annotations.length &&
          annotations[0].isFormFieldPlaceholder()
        ) {
          selectedFormFieldAnnotation = annotation;
        }
      });
    });
  }, []);

  return (
    <div className="App">
      <div className="webviewer" ref={viewer}></div>
    </div>
  );
};

export default App;
